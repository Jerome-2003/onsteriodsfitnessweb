import { useState } from "react";
import { NavLink } from "react-router";

const Header = () => {

    const [menuOpen, setMenuOpen] = useState(false);

    const navLinks = [
        { label: "Home",      path: "/" },
        { label: "Videos",    path: "/videos" },
        { label: "Junkies",   path: "/junkies" },
        { label: "Community", path: "/community" },
    ];

    return (
        <>
            <div>
                <header className="relative z-20 flex items-center justify-between px-6 md:px-8 h-[64px]
                                   bg-black/40 backdrop-blur-md border-b border-white/10">

                    {/* LEFT — Logo */}
                    <div>
                        <h1 className="font-['Bebas_Neue'] text-[15px] text-white tracking-[2px] leading-none m-0">
                            ON STEROIDS —
                        </h1>
                        <h5 className="text-[8px] text-white/60 tracking-[2.5px] uppercase font-normal mt-0.5 m-0">
                            FITNESS INFLUENCER & DIETITIAN
                        </h5>
                    </div>

                    {/* CENTER — Desktop Nav (hidden on mobile) */}
                    <ul className="hidden md:flex items-center list-none m-0 p-0 gap-0">
                        {navLinks.map((link) => (
                            <li key={link.label}>
                                <NavLink
                                    to={link.path}
                                    end={link.path === "/"}
                                    className={({ isActive }) =>
                                        `text-[13px] font-medium px-4 py-1.5 cursor-pointer transition-colors block
                                        ${isActive
                                            ? "text-white bg-[#e8400c]"
                                            : "text-white/90 hover:text-[#e8400c]"
                                        }`
                                    }
                                >
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    {/* RIGHT — Profile icon (desktop) + Hamburger (mobile) */}
                    <div className="flex items-center gap-3">

                        {/* Profile — visible on desktop only */}
                        <div className="hidden md:flex w-9 h-9 rounded-full bg-black/40 border border-white/20 items-center justify-center cursor-pointer hover:border-[#e8400c] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>

                        {/* Hamburger — visible on mobile only */}
                        <button
                            className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 cursor-pointer bg-transparent border-none"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Toggle menu"
                        >
                            <span className={`block w-6 h-0.5 bg-white transition-all duration-300
                                ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
                            />
                            <span className={`block w-6 h-0.5 bg-white transition-all duration-300
                                ${menuOpen ? "opacity-0" : ""}`}
                            />
                            <span className={`block w-6 h-0.5 bg-white transition-all duration-300
                                ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
                            />
                        </button>

                    </div>
                </header>

                {/* MOBILE DROPDOWN MENU */}
                <div className={`relative z-20 md:hidden bg-black/80 backdrop-blur-md
                                 border-b border-white/10 overflow-hidden transition-all duration-300
                                 ${menuOpen ? "max-h-96 py-2" : "max-h-0"}`}
                >
                    <ul className="list-none m-0 p-0">
                        {navLinks.map((link) => (
                            <li key={link.label}>
                                <NavLink
                                    to={link.path}
                                    end={link.path === "/"}
                                    onClick={() => setMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `text-[14px] font-medium px-6 py-3 cursor-pointer border-b border-white/10 transition-colors block
                                        ${isActive
                                            ? "text-white bg-[#e8400c]"
                                            : "text-white/80 hover:text-[#e8400c] hover:bg-white/5"
                                        }`
                                    }
                                >
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}

                        {/* Profile row inside mobile menu */}
                        <li className="flex items-center gap-3 px-6 py-3 text-white/80 cursor-pointer hover:text-[#e8400c] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span className="text-[14px] font-medium">Profile</span>
                        </li>
                    </ul>
                </div>
            </div>
        </>
    );
};
export default Header;
