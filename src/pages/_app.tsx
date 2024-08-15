import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Script from "next/script";
import Head from "next/head";
import Link from "next/link";
import Joyride from "react-joyride";
import { useEffect, useState } from "react";

const GOOGLE_ANALYTICS_ID = 'G-FFEZLLGR2Z'


const steps = [
    {
        target: "#gnn101",
        content: "Welcome to GNN 101!"
    },
    {
      target: '#task-selector',
      content: 'Click here to select the task for GNN!',
    },
    {
        target: '#model-architecture',
        content: 'The model architecture menu is here!',
    },
    {
        target: '#dataset-selector',
        content: 'Click here to switch the input data!',
    },
    {
        target: '#dataset-description',
        content: 'The dataset description is here!',
    },
    {
        target: '#graph-statistics',
        content: 'Here is the graph statistic!',
    },
    {
        target: '#text-panel',
        content: 'More details about GNN on text panel!',
    },
    {
        target: '#click-to-predict',
        content: 'Click predict to start!',
    }
];

export default function App({ Component, pageProps }: AppProps) {

    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      //  (document.body.style as any).zoom = "70%";
        setIsClient(true);

    }, []);

    return <>
   {isClient && ( <Joyride steps={steps} continuous={true} showProgress={true} showSkipButton={true} />)}
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
