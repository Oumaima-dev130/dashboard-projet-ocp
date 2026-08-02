import Bac from "../models/Bac.js";
import Poste from "../models/Poste.js";
import Attachement from "../models/Attachement.js";

// GET /api/budget/data?projectId=...&bacId=...
// ⚠️ MIGRATION : `projectId` est maintenant requis. Tous les Bacs listés et le
// Bac sélectionné par défaut sont limités à CE projet — plus aucun mélange
// possible entre les données budget de deux projets différents.
export const getBudgetData = async (req, res) => {
  try {
    const { projectId } = req.query;
    let { bacId } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: "projectId requis" });
    }

    if (!bacId) {
      const firstBac = await Bac.findOne({ projectId }).sort({ nom: 1 });
      if (!firstBac) {
        return res.json({ bacId: null, bacNom: null, bacs: [], items: [], attachments: [] });
      }
      bacId = firstBac._id.toString();
    }

    const bacs = await Bac.find({ projectId }).sort({ nom: 1 });
    const bac = bacs.find((b) => b._id.toString() === bacId);
    if (!bac) {
      // Le Bac demandé n'appartient pas à ce projet : on ne renvoie jamais les
      // données d'un autre projet, même par erreur de bacId.
      return res.status(404).json({ message: "Bac introuvable pour ce projet" });
    }

    const postes = await Poste.find({ bacId }).sort({ numero: 1 });
    const posteIds = postes.map((p) => p._id);
    const attachementsDb = await Attachement.find({ posteId: { $in: posteIds } }).sort({ numero: 1, date: 1 });

    const numeroGroups = {};
    attachementsDb.forEach((att) => {
      if (!numeroGroups[att.numero]) numeroGroups[att.numero] = [];
      numeroGroups[att.numero].push(att);
    });

    const attachments = Object.keys(numeroGroups)
      .map(Number)
      .sort((a, b) => a - b)
      .map((numero) => {
        const group = numeroGroups[numero];
        const dates = group.map((a) => a.date).filter(Boolean);
        const earliestDate = dates.length > 0 ? new Date(Math.min(...dates.map((d) => new Date(d)))) : null;
        const allRealise = group.every((a) => a.statut === "realise");
        return {
          id: `att-${numero}`,
          numero,
          name: `Attachement ${numero}`,
          date: earliestDate,
          status: allRealise ? "realise" : "planned",
        };
      });

    const items = postes.map((poste) => {
      const budgetHT = (poste.quantite || 0) * (poste.prixUnitaire || 0);
      const posteAttachements = attachementsDb.filter((a) => a.posteId.toString() === poste._id.toString());

      const percentages = {};
      const attachementIds = {};
      const realise = {};
      attachments.forEach((att) => {
        const match = posteAttachements.find((a) => a.numero === att.numero);
        attachementIds[att.id] = match ? match._id.toString() : null;
        realise[att.id] = match ? match.statut === "realise" : false;
        if (!match) {
          percentages[att.id] = 0;
          return;
        }
        if (match.pourcentage != null) {
          percentages[att.id] = match.pourcentage / 100;
        } else if (match.montantHTManuel != null && budgetHT > 0) {
          percentages[att.id] = Math.min(match.montantHTManuel / budgetHT, 1);
        } else {
          percentages[att.id] = 0;
        }
      });

      const documents = [];
      posteAttachements.forEach((a) => {
        if (a.document) {
          documents.push({ name: `Att. ${a.numero} - document`, url: a.document, uploadedAt: a.date });
        }
        (a.photos || []).forEach((photo, i) => {
          documents.push({ name: `Att. ${a.numero} - photo ${i + 1}`, url: photo, uploadedAt: a.date });
        });
      });

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

    res.json({
      bacId,
      bacNom: bac.nom,
      bacs: bacs.map((b) => ({ _id: b._id, nom: b.nom })),
      items,
      attachments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors du chargement des données budget" });
  }
};
