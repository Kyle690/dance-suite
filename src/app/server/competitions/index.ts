'use server';
import { createCompetition, getCompetitions, getCompetition, updateCompetition } from "@/app/server/competitions/detailsActions";
import { updateAdjudicators, getAdjudicators } from "@/app/server/competitions/adjudicatorActions";
import { createPanel, updatePanel, deletePanel, getPanels } from "@/app/server/competitions/panelActions";
import { createSection, updateSection, deleteSection, getCompetitionSections, getCompetitionSection } from "@/app/server/competitions/sectionActions";
import { createDancer, updateDancer, deleteDancer, getSectionDancers } from "@/app/server/competitions/dancerActions";

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

}
