'use server';
import { createCompetition, getCompetitions, getCompetition, updateCompetition } from "@/app/server/competitions/competitionActions";
import { updateAdjudicators, getAdjudicators } from "@/app/server/competitions/adjudicatorActions";
import { createPanel, updatePanel, deletePanel, getPanels } from "@/app/server/competitions/panelActions";
import { createSection, updateSection, deleteSection, getCompetitionSections, getCompetitionSection, getSectionHeats } from "@/app/server/competitions/sectionActions";
import { createDancer, updateDancer, deleteDancer, getSectionDancers } from "@/app/server/competitions/dancerActions";
import { createHeat, updateHeat, deleteHeat, activateHeat, getHeatDancers, updateHeatDancers }from '@/app/server/competitions/heatActions'
import { submitRoundMarks, getHeatRoundMarks, createHeatResult, getHeatRoundResult, approveHeatResult, deleteMarks } from "@/app/server/competitions/marksActions";
import { printHeatResult } from "@/app/server/competitions/pdfActions";

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
    getPanels,
    createSection,
    updateSection,
    deleteSection,
    getCompetitionSections,
    getCompetitionSection,
    createDancer,
    updateDancer,
    deleteDancer,
    getSectionDancers,
    getSectionHeats,
    createHeat,
    updateHeat,
    deleteHeat,
    activateHeat,
    getHeatDancers,
    updateHeatDancers,
    submitRoundMarks,
    getHeatRoundMarks,
    createHeatResult,
    getHeatRoundResult,
    approveHeatResult,
    printHeatResult,
}
