'use server';
import { createCompetition, getCompetitions, getCompetition, updateCompetition } from "@/app/server/competitions/detailsActions";
import { updateAdjudicators, getAdjudicators } from "@/app/server/competitions/adjudicatorActions";
import { createPanel, updatePanel, deletePanel, getPanels } from "@/app/server/competitions/panelActions";

export {
    createCompetition,
    getCompetitions,
    getCompetition,
    updateCompetition,
    updateAdjudicators,
    getAdjudicators,
    createPanel,
    updatePanel,
    deletePanel,
    getPanels
}
