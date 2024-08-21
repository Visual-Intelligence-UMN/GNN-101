import styles from './surfaces.module.css';

type Props = {
    startIntro: () => void;
}
export default function Navbar(props: Props) {
    return <>

        <nav className={styles.header}>
            <div className="flex flex-wrap items-center justify-between mx-20">
                <a href="#" className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="self-center text-2xl font-semibold whitespace-nowrap text-white">
                        {/* <Image src='/assets/PNGs/logo/GNNLogo.png' alt="Logo" width={220} height={75} style={{ width: 'auto' }} /> */}
                        <img src='./assets/PNGs/logo/GNNLogo.png' alt="Logo" width={220} height={75} />
                    </div>
                </a>
                <div id="navbar-default">
                    <ul className="font-medium flex flex-row md:space-x-8 rtl:space-x-reverse">
                        <li>
                            <a onClick={props.startIntro} className="text-gray-900 md:hover:text-blue-300 md:p-0 text-white " style={{ cursor: "pointer" }}>Intro</a>
                        </li>
                        <li>
                            <a href="https://github.com/Visual-Intelligence-UMN/web-gnn-vis" target='_blank' className="text-gray-900 md:hover:text-blue-300 md:p-0 text-white ">Github</a>
                        </li>
                        <li>
                            <a href="https://youtu.be/_0jXy4Zoh-o" target='_blank' className="text-gray-900 md:hover:text-blue-300 md:p-0 text-white ">Demo Video</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    </>

}