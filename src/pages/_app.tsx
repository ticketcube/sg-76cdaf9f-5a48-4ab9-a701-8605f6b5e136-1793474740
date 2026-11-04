import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Index page (player) should have no layout for embedding
  // Admin and auth pages should have Layout
  const shouldUseLayout = router.pathname.startsWith("/admin") || 
                         router.pathname.startsWith("/auth") ||
                         router.pathname === "/schedule";

  return (
    <AuthProvider>
      {shouldUseLayout ? (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      ) : (
        <Component {...pageProps} />
      )}
    </AuthProvider>
  );
}