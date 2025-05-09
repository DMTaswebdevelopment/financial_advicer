import footerData from "@/component/data/footer/Footer";
import React from "react";

const { footerLinks, socialMedia } = footerData;

const Footer = () => {
  return (
    <footer className="py-12 px-16 border-t border-gray-200 bg-white">
      <div className="w-full ">
        <div className="mb-10">
          <div className="flex items-center mb-4">
            <svg
              className="h-8 w-8 text-indigo-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4 12C4 9.79086 5.79086 8 8 8H16C18.2091 8 20 9.79086 20 12C20 14.2091 18.2091 16 16 16H8C5.79086 16 4 14.2091 4 12Z" />
              <path d="M4 4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4C20 5.10457 19.1046 6 18 6H6C4.89543 6 4 5.10457 4 4Z" />
              <path d="M4 20C4 18.8954 4.89543 18 6 18H18C19.1046 18 20 18.8954 20 20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20Z" />
            </svg>
          </div>
          <p className="text-gray-600">
            Making the world a better place through constructing elegant
            hierarchies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex space-x-4 md:col-span-1">
            {socialMedia.map((social, index) => (
              <div className="" key={index}>
                <a
                  href={social.link}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {social.icon}
                </a>
              </div>
            ))}
          </div>

          <div className="flex space-x-56">
            {footerLinks.map((footer, index) => (
              <div className="" key={index}>
                <h3 className="font-semibold text-gray-900 mb-4">
                  {footer.title}
                </h3>
                <ul className="space-y-3">
                  <li className="flex flex-col gap-4">
                    {footer.links.map((link, index) => (
                      <a
                        href={link.href}
                        key={index}
                        className="text-gray-600 hover:text-indigo-600"
                      >
                        {link.name}
                      </a>
                    ))}
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-gray-500 text-sm">
          © 2024 Your Company, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
