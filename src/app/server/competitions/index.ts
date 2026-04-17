'use server';
import { createCompetition, getCompetitions, getCompetition, updateCompetition, updateCompetitionStatus } from "@/app/server/competitions/competitionActions";
import { updateAdjudicators, getAdjudicators, getAdjudicatorDetail, updateAdjudicatorContact } from "@/app/server/competitions/adjudicatorActions";
import { sendAdjudicatorLoginEmail } from "@/app/server/competitions/adjudicatorEmailActions";
import { importCompetition } from "@/app/server/competitions/importActions";
import { createPanel, updatePanel, deletePanel, getPanels } from "@/app/server/competitions/panelActions";
import { createSection, updateSection, deleteSection, getCompetitionSections, getCompetitionSection, getSectionHeats } from "@/app/server/competitions/sectionActions";
import { createDancer, updateDancer, deleteDancer, getSectionDancers, importDancers } from "@/app/server/competitions/dancerActions";
import { createHeat, updateHeat, deleteHeat, updateHeatStatus, getHeatDancers, updateHeatDancers, getCompetitionHeats }from '@/app/server/competitions/heatActions'
import { submitRoundMarks, getHeatRoundMarks, createHeatResult, getHeatRoundResult, approveHeatResult, deleteMarks, submitFinalMarks, approveFinalResult } from "@/app/server/competitions/marksActions";
import { printHeatResult, printFinalResult } from "@/app/server/competitions/pdfActions";

export {
    createCompetition,
    getCompetitions,
    getCompetition,
    updateCompetition,
    updateCompetitionStatus,
    updateAdjudicators,
    getAdjudicators,
    getAdjudicatorDetail,
    updateAdjudicatorContact,
    sendAdjudicatorLoginEmail,
    importCompetition,
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
    importDancers,
    getSectionHeats,
    createHeat,
    updateHeat,
    deleteHeat,
    updateHeatStatus,
    getHeatDancers,
    updateHeatDancers,
    getCompetitionHeats,
    submitRoundMarks,
    getHeatRoundMarks,
    createHeatResult,
    getHeatRoundResult,
    approveHeatResult,
    submitFinalMarks,
    printHeatResult,
    printFinalResult,
    approveFinalResult,
}
