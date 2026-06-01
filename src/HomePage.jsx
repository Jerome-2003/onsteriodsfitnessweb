import Header from "./components/Header"

const HomePage = () => {


    return (
        <div
            className="relative min-h-screen bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/couple.png')" }}
        >
            {/* overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

            {/* HEADER */}
         <Header />

            {/* HERO CONTENT */}
            <div className="relative z-10 flex items-end min-h-[calc(100vh-64px)] px-6 md:px-12 pb-16">
                <div>
                    <p className="font-['Bebas_Neue'] text-[32px] md:text-[42px] text-white leading-[1.1]
                        tracking-[1.5px] uppercase max-w-md mb-6">
                        Juice your blender, juice your glutes, and let's pretend we enjoy sweating.
                    </p>
                    <button className="bg-transparent text-white border-2 border-white
                        px-6 py-3 text-xs font-medium tracking-[2px] uppercase
                        cursor-pointer hover:bg-[#e8400c] hover:border-[#e8400c] transition-colors duration-200">
                        Join Us
                    </button>
                </div>
            </div>

        </div>
    )
}

export default HomePage