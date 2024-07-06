export default function Footer() {
    return <footer className="fixed bottom-0 bg-white rounded-lg shadow m-4 w-full">
        <span className="block text-md text-gray-500 sm:text-center dark:text-gray-400" >© {new Date().getFullYear()} {` `}
            University of Minnesota, Twin Cities.
            All Rights Reserved.</span>
    </footer>
}
