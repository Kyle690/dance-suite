'use server';
import { getLiveCompetitions } from "@/app/server/adjudicator/competitionActions";
import { getAdjudicatorSections, getAdjudicatorHeat, submitAdjudicatorHeatMarks } from "@/app/server/adjudicator/adjudicatorActions";

export {
    getLiveCompetitions,
    getAdjudicatorSections,
    getAdjudicatorHeat,
    submitAdjudicatorHeatMarks
}
