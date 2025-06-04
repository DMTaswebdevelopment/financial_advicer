import footerData from "@/component/data/footer/Footer";
import React from "react";

const { footerLinks, socialMedia } = footerData;

const Footer = () => {
  return (
    <footer className="py-8 px-4 sm:py-10 sm:px-6 lg:py-12 lg:px-20 border-t border-gray-200 bg-white relative z-50">
      <div className="w-full max-w-8xl">
        {/* Brand Section */}
        <div className="mb-8 lg:mb-10">
          <div className="flex items-center mb-4">
            <svg
              className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4 12C4 9.79086 5.79086 8 8 8H16C18.2091 8 20 9.79086 20 12C20 14.2091 18.2091 16 16 16H8C5.79086 16 4 14.2091 4 12Z" />
              <path d="M4 4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4C20 5.10457 19.1046 6 18 6H6C4.89543 6 4 5.10457 4 4Z" />
              <path d="M4 20C4 18.8954 4.89543 18 6 18H18C19.1046 18 20 18.8954 20 20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20Z" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm sm:text-base max-w-md">
            Making the world a better place through constructing elegant
            hierarchies.
          </p>
        </div>

        {/* Main Content Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Social Media Section */}
          <div className="order-2 md:order-1 lg:col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4 md:hidden">
              Follow Us
            </h3>
            <div className="flex space-x-4 md:flex-col md:space-x-0 md:space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
              {socialMedia.map((social, index) => (
                <a
                  key={index}
                  href={social.link}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  aria-label={`Follow us on ${social.name || "social media"}`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links Section */}
          <div className="order-1 md:order-2 lg:col-span-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
              {footerLinks.map((footer, index) => (
                <div key={index} className="space-y-4">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                    {footer.title}
                  </h3>
                  <ul className="space-y-3">
                    {footer.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <a
                          href={link.href}
                          className="text-gray-600 hover:text-indigo-600 transition-colors duration-200 text-sm sm:text-base block"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="mt-8 lg:mt-12 pt-6 lg:pt-8 border-t border-gray-200 max-w-7xl mx-auto">
        <p className="text-gray-500 text-xs sm:text-sm text-center md:text-left">
          © 2024 Your Company, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
