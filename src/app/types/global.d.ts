export {};

type MaterialColors = 'primary'|'secondary'|'error'|'info'|'success'|'warning'|'inherit';

declare module '@toolpad/core' {
    interface AppTitleProps {
        competition?: import('@prisma/client').competition;
    }
}
