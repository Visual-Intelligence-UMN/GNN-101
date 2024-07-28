import styles from './surfaces.module.css';
import Image from 'next/image';
export default function Navbar() {
    return <>
    
        <nav className={styles.header}>
            <div className="flex flex-wrap items-center justify-between mx-20">
                <a href="#" className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="self-center text-2xl font-semibold whitespace-nowrap text-white">
                        <Image src='./assets/SVGs/GNNLogo.svg' alt="Logo" width={150} height={150} />
                        </div>
                </a>
                <div id="navbar-default">
                    <ul className="font-medium flex flex-row md:space-x-8 rtl:space-x-reverse">
                        <li>
                            <a href="#" className="text-gray-900 md:hover:text-blue-300 md:p-0 text-white" >About</a>
                        </li>
                        <li>
                            <a href="https://github.com/Visual-Intelligence-UMN/web-gnn-vis" target='_blank' className="text-gray-900 md:hover:text-blue-300 md:p-0 text-white ">Github</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    </>

}