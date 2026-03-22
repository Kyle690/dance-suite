import { CompetitiveType, HeatStatus, HeatType, SectionEntryType } from "@prisma/client";
import { ChipProps } from "@mui/material";

type ChipColor = ChipProps['color'];

export const getHeatTypeColor = (type: HeatType): ChipColor => {
    switch (type) {
    case HeatType.ROUND:
        return 'info';
    case HeatType.QUARTER_FINAL:
        return 'secondary';
    case HeatType.SEMI_FINAL:
        return 'warning';
    case HeatType.FINAL:
        return 'primary';
    case HeatType.UNCONTESTED:
        return 'default';
    default:
        return 'default';
    }
};

export const getHeatStatusColor = (status: HeatStatus): ChipColor => {
    switch (status) {
    case HeatStatus.DRAFT:
        return 'default';
    case HeatStatus.ACTIVE:
        return 'info';
    case HeatStatus.MARSHALLING:
        return 'warning';
    case HeatStatus.READY:
        return 'secondary';
    case HeatStatus.JUDGING:
        return 'primary';
    case HeatStatus.REVIEWING:
        return 'warning';
    case HeatStatus.CHECKING:
        return 'warning';
    case HeatStatus.COMPLETE:
        return 'success';
    case HeatStatus.CANCELED:
        return 'error';
    default:
        return 'default';
    }
};

export const getEntryTypeColor = (type: SectionEntryType): ChipColor => {
    switch (type) {
    case SectionEntryType.SOLO:
        return 'info';
    case SectionEntryType.DUO:
        return 'secondary';
    case SectionEntryType.COUPLE:
        return 'primary';
    case SectionEntryType.GROUP:
        return 'success';
    default:
        return 'default';
    }
};

export const getCompetitiveTypeColor = (type: CompetitiveType): ChipColor => {
    switch (type) {
    case CompetitiveType.COMPETITIVE:
        return 'primary';
    case CompetitiveType.SOCIAL:
        return 'success';
    case CompetitiveType.MIXED_COMPETITIVE:
        return 'warning';
    default:
        return 'default';
    }
};