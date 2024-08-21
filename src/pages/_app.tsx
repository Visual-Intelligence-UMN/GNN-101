import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Script from "next/script";
import Head from "next/head";
import Link from "next/link";


const GOOGLE_ANALYTICS_ID = 'G-FFEZLLGR2Z'



export default function App({ Component, pageProps }: AppProps) {



    return <>
        <Link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
        />
        <Head>
            <link rel="icon" href='./assets/PNGs/logo/logo.png' />
            <title>GNN 101</title>
        </Head>
        <Script
            strategy="lazyOnload"
            src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
        />

        <Script strategy="lazyOnload" id="script#1">
            {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ANALYTICS_ID}');
         `}
        </Script>
        <Component {...pageProps} />;
    </>
}
