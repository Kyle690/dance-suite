import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import App from "@/app/components/App";

export const metadata: Metadata = {
    title: "Dance Suite",
    description: "A comprehensive dance competition management system",
};


const RootLayout=({
    children,
}: Readonly<{
  children: React.ReactNode;
}>)=> {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <AppRouterCacheProvider options={{ enableCssLayer: true }}>
                    <App>
                        {children}
                    </App>
                </AppRouterCacheProvider>
            </body>
        </html>
    );
}

export default RootLayout;
