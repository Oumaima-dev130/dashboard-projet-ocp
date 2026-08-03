import Bac from "../models/Bac.js";
import Poste from "../models/Poste.js";
import Attachement from "../models/Attachement.js";

export const getBudgetData = async (req, res) => {
  try {
    const { projectId } = req.query;
    let { bacId } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: "projectId requis" });
    }

    // 1. Récupérer les Bacs du projet
    const bacs = await Bac.find(
      { projectId },
      { _id: 1, nom: 1 }
    )
      .sort({ nom: 1 })
      .lean();

    if (!bacs.length) {
      return res.json({
        bacId: null,
        bacNom: null,
        bacs: [],
        items: [],
        attachments: [],
      });
    }

    // 2. Si aucun Bac n'est sélectionné,
    // prendre le premier
    if (!bacId) {
      bacId = bacs[0]._id.toString();
    }

    // 3. Vérifier que le Bac appartient bien au projet
    const bac = bacs.find(
      (b) => b._id.toString() === bacId
    );

    if (!bac) {
      return res.status(404).json({
        message: "Bac introuvable pour ce projet",
      });
    }

    // 4. Récupérer les postes
    const postes = await Poste.find(
      { bacId },
      {
        _id: 1,
        numero: 1,
        designation: 1,
        rubrique: 1,
        unite: 1,
        quantite: 1,
        prixUnitaire: 1,
      }
    )
      .sort({ numero: 1 })
      .lean();

    if (!postes.length) {
      return res.json({
        bacId,
        bacNom: bac.nom,
        bacs: bacs.map((b) => ({
          _id: b._id,
          nom: b.nom,
        })),
        items: [],
        attachments: [],
      });
    }

    // 5. IDs des postes
    const posteIds = postes.map((p) => p._id);

    // 6. Récupérer tous les attachements en une seule requête
    const attachementsDb = await Attachement.find(
      { posteId: { $in: posteIds } },
      {
        _id: 1,
        posteId: 1,
        numero: 1,
        pourcentage: 1,
        montantHTManuel: 1,
        date: 1,
        statut: 1,
        document: 1,
        photos: 1,
      }
    )
      .sort({ numero: 1, date: 1 })
      .lean();

    // ============================================================
    // 7. Créer une Map des attachements par poste
    // ============================================================

    const attachmentsByPoste = new Map();

    for (const att of attachementsDb) {
      const key = att.posteId.toString();

      if (!attachmentsByPoste.has(key)) {
        attachmentsByPoste.set(key, []);
      }

      attachmentsByPoste.get(key).push(att);
    }

    // ============================================================
    // 8. Créer les groupes d'attachements par numéro
    // ============================================================

    const numeroGroups = new Map();

    for (const att of attachementsDb) {
      if (!numeroGroups.has(att.numero)) {
        numeroGroups.set(att.numero, []);
      }

      numeroGroups.get(att.numero).push(att);
    }

    // ============================================================
    // 9. Construire la liste globale des attachments
    // ============================================================

    const attachments = Array.from(numeroGroups.entries())
      .sort(([a], [b]) => a - b)
      .map(([numero, group]) => {
        const dates = group
          .map((a) => a.date)
          .filter(Boolean)
          .map((d) => new Date(d).getTime());

        const earliestDate =
          dates.length > 0
            ? new Date(Math.min(...dates))
            : null;

        const allRealise = group.every(
          (a) => a.statut === "realise"
        );

        return {
          id: `att-${numero}`,
          numero,
          name: `Attachement ${numero}`,
          date: earliestDate,
          status: allRealise
            ? "realise"
            : "planned",
        };
      });

    // ============================================================
    // 10. Liste des numéros d'attachements
    // ============================================================

    const attachmentNumbers = attachments.map(
      (att) => att.numero
    );

    // ============================================================
    // 11. Construire les items rapidement
    // ============================================================

    const items = postes.map((poste) => {
      const budgetHT =
        (poste.quantite || 0) *
        (poste.prixUnitaire || 0);

      const posteAttachements =
        attachmentsByPoste.get(
          poste._id.toString()
        ) || [];

      // Map des attachements du poste par numéro
      const attachementByNumero = new Map();

      for (const att of posteAttachements) {
        attachementByNumero.set(
          att.numero,
          att
        );
      }

      const percentages = {};
      const attachementIds = {};
      const realise = {};

      for (const numero of attachmentNumbers) {
        const att = attachementByNumero.get(numero);
        const attId = `att-${numero}`;

        attachementIds[attId] = att
          ? att._id.toString()
          : null;

        realise[attId] = att
          ? att.statut === "realise"
          : false;

        if (!att) {
          percentages[attId] = 0;
          continue;
        }

        if (att.pourcentage != null) {
          percentages[attId] =
            att.pourcentage / 100;
        } else if (
          att.montantHTManuel != null &&
          budgetHT > 0
        ) {
          percentages[attId] = Math.min(
            att.montantHTManuel / budgetHT,
            1
          );
        } else {
          percentages[attId] = 0;
        }
      }

      // Documents
      const documents = [];

      for (const att of posteAttachements) {
        if (att.document) {
          documents.push({
            name: `Att. ${att.numero} - document`,
            url: att.document,
            uploadedAt: att.date,
          });
        }

        if (Array.isArray(att.photos)) {
          att.photos.forEach((photo, index) => {
            documents.push({
              name: `Att. ${att.numero} - photo ${index + 1}`,
              url: photo,
              uploadedAt: att.date,
            });
          });
        }
      }

      return {
        _id: poste._id,
        name: poste.designation,
        rubrique: poste.rubrique || "Autre",
        fullDescription: poste.designation,
        unit: poste.unite,
        quantity: poste.quantite,
        unitCost: poste.prixUnitaire,
        percentages,
        realise,
        attachementIds,
        documents,
      };
    });

    // ============================================================
    // 12. Réponse
    // ============================================================

    return res.json({
      bacId,
      bacNom: bac.nom,
      bacs: bacs.map((b) => ({
        _id: b._id,
        nom: b.nom,
      })),
      items,
      attachments,
    });
  } catch (err) {
    console.error("❌ getBudgetData:", err);

    return res.status(500).json({
      message:
        "Erreur lors du chargement des données budget",
    });
  }
};