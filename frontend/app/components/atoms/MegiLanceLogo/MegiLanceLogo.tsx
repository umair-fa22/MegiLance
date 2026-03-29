// @AI-HINT: This component renders the MegiLance SVG logo and is fully theme-aware.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './MegiLanceLogo.common.module.css';
import lightStyles from './MegiLanceLogo.light.module.css';
import darkStyles from './MegiLanceLogo.dark.module.css';

export const MegiLanceLogo: React.FC<{ className?: string }> = ({ className }) => {
  const { resolvedTheme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  // Always render the logo to avoid hydration mismatch
  // Server will render with default theme, client will hydrate correctly
  return (
    <div className={cn(commonStyles.logoWrapper, className)}>
      <svg
        className={commonStyles.logoSvg}
        width="32"
        height="32"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="MegiLance Logo"
        role="img"
      >
        <title>MegiLance Logo</title>
        <desc>MegiLance brand logo featuring stylized ML lettermark</desc>
        <path d="M400 0H0V400H400V0Z" fill="#1D2127"/>
<path d="M75 300.375V97.25" stroke="url(#paint0_linear_98_3)" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M200 300.375V97.25" stroke="url(#paint1_linear_98_3)" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M75 97.25L137.5 191" stroke="url(#paint2_linear_98_3)" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M200 97.25L137.5 191" stroke="url(#paint3_linear_98_3)" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M246.875 97.25V300.375" stroke="url(#paint4_linear_98_3)" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M246.875 300.375H325" stroke="url(#paint5_linear_98_3)" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round"/>
<path opacity="0.6" d="M75 124.594C90.1016 124.594 102.344 112.352 102.344 97.25C102.344 82.1484 90.1016 69.9062 75 69.9062C59.8984 69.9062 47.6562 82.1484 47.6562 97.25C47.6562 112.352 59.8984 124.594 75 124.594Z" fill="url(#paint6_linear_98_3)"/>
<path d="M75 119.125C87.0812 119.125 96.875 109.331 96.875 97.25C96.875 85.1687 87.0812 75.375 75 75.375C62.9188 75.375 53.125 85.1687 53.125 97.25C53.125 109.331 62.9188 119.125 75 119.125Z" fill="url(#paint7_linear_98_3)"/>
<path opacity="0.9" d="M75 106.625C80.1773 106.625 84.375 102.427 84.375 97.25C84.375 92.0727 80.1773 87.875 75 87.875C69.8227 87.875 65.625 92.0727 65.625 97.25C65.625 102.427 69.8227 106.625 75 106.625Z" fill="url(#paint8_linear_98_3)"/>
<path opacity="0.6" d="M200 124.594C215.102 124.594 227.344 112.352 227.344 97.25C227.344 82.1484 215.102 69.9062 200 69.9062C184.898 69.9062 172.656 82.1484 172.656 97.25C172.656 112.352 184.898 124.594 200 124.594Z" fill="url(#paint9_linear_98_3)"/>
<path d="M200 119.125C212.081 119.125 221.875 109.331 221.875 97.25C221.875 85.1687 212.081 75.375 200 75.375C187.919 75.375 178.125 85.1687 178.125 97.25C178.125 109.331 187.919 119.125 200 119.125Z" fill="url(#paint10_linear_98_3)"/>
<path opacity="0.9" d="M200 106.625C205.177 106.625 209.375 102.427 209.375 97.25C209.375 92.0727 205.177 87.875 200 87.875C194.823 87.875 190.625 92.0727 190.625 97.25C190.625 102.427 194.823 106.625 200 106.625Z" fill="url(#paint11_linear_98_3)"/>
<path opacity="0.6" d="M137.5 218.344C152.602 218.344 164.844 206.102 164.844 191C164.844 175.898 152.602 163.656 137.5 163.656C122.398 163.656 110.156 175.898 110.156 191C110.156 206.102 122.398 218.344 137.5 218.344Z" fill="url(#paint12_linear_98_3)"/>
<path d="M137.5 212.875C149.581 212.875 159.375 203.081 159.375 191C159.375 178.919 149.581 169.125 137.5 169.125C125.419 169.125 115.625 178.919 115.625 191C115.625 203.081 125.419 212.875 137.5 212.875Z" fill="url(#paint13_linear_98_3)"/>
<path opacity="0.9" d="M137.5 200.375C142.677 200.375 146.875 196.177 146.875 191C146.875 185.823 142.677 181.625 137.5 181.625C132.323 181.625 128.125 185.823 128.125 191C128.125 196.177 132.323 200.375 137.5 200.375Z" fill="url(#paint14_linear_98_3)"/>
<path opacity="0.6" d="M246.875 124.594C261.977 124.594 274.219 112.352 274.219 97.25C274.219 82.1484 261.977 69.9062 246.875 69.9062C231.773 69.9062 219.531 82.1484 219.531 97.25C219.531 112.352 231.773 124.594 246.875 124.594Z" fill="url(#paint15_linear_98_3)"/>
<path d="M246.875 119.125C258.956 119.125 268.75 109.331 268.75 97.25C268.75 85.1687 258.956 75.375 246.875 75.375C234.794 75.375 225 85.1687 225 97.25C225 109.331 234.794 119.125 246.875 119.125Z" fill="url(#paint16_linear_98_3)"/>
<path opacity="0.9" d="M246.875 106.625C252.052 106.625 256.25 102.427 256.25 97.25C256.25 92.0727 252.052 87.875 246.875 87.875C241.698 87.875 237.5 92.0727 237.5 97.25C237.5 102.427 241.698 106.625 246.875 106.625Z" fill="url(#paint17_linear_98_3)"/>
<path opacity="0.6" d="M246.875 327.719C261.977 327.719 274.219 315.477 274.219 300.375C274.219 285.273 261.977 273.031 246.875 273.031C231.773 273.031 219.531 285.273 219.531 300.375C219.531 315.477 231.773 327.719 246.875 327.719Z" fill="url(#paint18_linear_98_3)"/>
<path d="M246.875 322.25C258.956 322.25 268.75 312.456 268.75 300.375C268.75 288.294 258.956 278.5 246.875 278.5C234.794 278.5 225 288.294 225 300.375C225 312.456 234.794 322.25 246.875 322.25Z" fill="url(#paint19_linear_98_3)"/>
<path opacity="0.9" d="M246.875 309.75C252.052 309.75 256.25 305.552 256.25 300.375C256.25 295.198 252.052 291 246.875 291C241.698 291 237.5 295.198 237.5 300.375C237.5 305.552 241.698 309.75 246.875 309.75Z" fill="url(#paint20_linear_98_3)"/>
<path opacity="0.6" d="M325 327.719C340.102 327.719 352.344 315.477 352.344 300.375C352.344 285.273 340.102 273.031 325 273.031C309.898 273.031 297.656 285.273 297.656 300.375C297.656 315.477 309.898 327.719 325 327.719Z" fill="url(#paint21_linear_98_3)"/>
<path d="M325 322.25C337.081 322.25 346.875 312.456 346.875 300.375C346.875 288.294 337.081 278.5 325 278.5C312.919 278.5 303.125 288.294 303.125 300.375C303.125 312.456 312.919 322.25 325 322.25Z" fill="url(#paint22_linear_98_3)"/>
<path opacity="0.9" d="M325 309.75C330.177 309.75 334.375 305.552 334.375 300.375C334.375 295.198 330.177 291 325 291C319.823 291 315.625 295.198 315.625 300.375C315.625 305.552 319.823 309.75 325 309.75Z" fill="url(#paint23_linear_98_3)"/>
<defs>
<linearGradient id="paint0_linear_98_3" x1="75" y1="97.25" x2="75" y2="300.375" gradientUnits="userSpaceOnUse">
<stop stopColor="white"/>
<stop offset="0.5" stopColor="#EAF6FF"/>
<stop offset="1" stopColor="#CFE8EF"/>
</linearGradient>
<linearGradient id="paint1_linear_98_3" x1="200" y1="97.25" x2="200" y2="300.375" gradientUnits="userSpaceOnUse">
<stop stopColor="white"/>
<stop offset="0.5" stopColor="#EAF6FF"/>
<stop offset="1" stopColor="#CFE8EF"/>
</linearGradient>
<linearGradient id="paint2_linear_98_3" x1="75" y1="97.25" x2="12450" y2="10878.5" gradientUnits="userSpaceOnUse">
<stop stopColor="white"/>
<stop offset="0.5" stopColor="#EAF6FF"/>
<stop offset="1" stopColor="#CFE8EF"/>
</linearGradient>
<linearGradient id="paint3_linear_98_3" x1="200" y1="97.2502" x2="12450" y2="10878.5" gradientUnits="userSpaceOnUse">
<stop stopColor="white"/>
<stop offset="0.5" stopColor="#EAF6FF"/>
<stop offset="1" stopColor="#CFE8EF"/>
</linearGradient>
<linearGradient id="paint4_linear_98_3" x1="246.875" y1="97.25" x2="246.875" y2="300.375" gradientUnits="userSpaceOnUse">
<stop stopColor="white"/>
<stop offset="0.5" stopColor="#EAF6FF"/>
<stop offset="1" stopColor="#CFE8EF"/>
</linearGradient>
<linearGradient id="paint5_linear_98_3" x1="246.875" y1="300.375" x2="325" y2="300.375" gradientUnits="userSpaceOnUse">
<stop stopColor="white"/>
<stop offset="0.5" stopColor="#EAF6FF"/>
<stop offset="1" stopColor="#CFE8EF"/>
</linearGradient>
<linearGradient id="paint6_linear_98_3" x1="47.6563" y1="69.9062" x2="5543.75" y2="5566" gradientUnits="userSpaceOnUse">
<stop stopColor="#4573DF"/>
<stop offset="1" stopColor="#2D4FA2"/>
</linearGradient>
<linearGradient id="paint7_linear_98_3" x1="53.125" y1="75.375" x2="4450" y2="4472.25" gradientUnits="userSpaceOnUse">
<stop stopColor="#4573DF"/>
<stop offset="1" stopColor="#2D4FA2"/>
</linearGradient>
<linearGradient id="paint8_linear_98_3" x1="65.625" y1="87.875" x2="1950" y2="1972.25" gradientUnits="userSpaceOnUse">
<stop stopColor="white"/>
<stop offset="0.5" stopColor="#EAF6FF"/>
<stop offset="1" stopColor="#CFE8EF"/>
</linearGradient>
<linearGradient id="paint9_linear_98_3" x1="172.656" y1="69.9062" x2="5668.75" y2="5566" gradientUnits="userSpaceOnUse">
<stop stopColor="#4573DF"/>
<stop offset="1" stopColor="#2D4FA2"/>
</linearGradient>
<linearGradient id="paint10_linear_98_3" x1="178.125" y1="75.375" x2="4575" y2="4472.25" gradientUnits="userSpaceOnUse">
<stop stopColor="#4573DF"/>
<stop offset="1" stopColor="#2D4FA2"/>
</linearGradient>
<linearGradient id="paint11_linear_98_3" x1="190.625" y1="87.875" x2="2075" y2="1972.25" gradientUnits="userSpaceOnUse">
<stop stopColor="white"/>
<stop offset="0.5" stopColor="#EAF6FF"/>
<stop offset="1" stopColor="#CFE8EF"/>
</linearGradient>
<linearGradient id="paint12_linear_98_3" x1="110.156" y1="163.656" x2="5606.25" y2="5659.75" gradientUnits="userSpaceOnUse">
<stop stopColor="#4573DF"/>
<stop offset="1" stopColor="#2D4FA2"/>
</linearGradient>
<linearGradient id="paint13_linear_98_3" x1="115.625" y1="169.125" x2="4512.5" y2="4566" gradientUnits="userSpaceOnUse">
<stop stopColor="#4573DF"/>
<stop offset="1" stopColor="#2D4FA2"/>
</linearGradient>
<linearGradient id="paint14_linear_98_3" x1="128.125" y1="181.625" x2="2012.5" y2="2066" gradientUnits="userSpaceOnUse">
<stop stopColor="white"/>
<stop offset="0.5" stopColor="#EAF6FF"/>
<stop offset="1" stopColor="#CFE8EF"/>
</linearGradient>
<linearGradient id="paint15_linear_98_3" x1="219.531" y1="69.9062" x2="5715.63" y2="5566" gradientUnits="userSpaceOnUse">
<stop stopColor="#4573DF"/>
<stop offset="1" stopColor="#2D4FA2"/>
</linearGradient>
<linearGradient id="paint16_linear_98_3" x1="225" y1="75.375" x2="4621.87" y2="4472.25" gradientUnits="userSpaceOnUse">
<stop stopColor="#4573DF"/>
<stop offset="1" stopColor="#2D4FA2"/>
</linearGradient>
<linearGradient id="paint17_linear_98_3" x1="237.5" y1="87.875" x2="2121.88" y2="1972.25" gradientUnits="userSpaceOnUse">
<stop stopColor="white"/>
<stop offset="0.5" stopColor="#EAF6FF"/>
<stop offset="1" stopColor="#CFE8EF"/>
</linearGradient>
<linearGradient id="paint18_linear_98_3" x1="219.531" y1="273.031" x2="5715.63" y2="5769.13" gradientUnits="userSpaceOnUse">
<stop stopColor="#4573DF"/>
<stop offset="1" stopColor="#2D4FA2"/>
</linearGradient>
<linearGradient id="paint19_linear_98_3" x1="225" y1="278.5" x2="4621.87" y2="4675.37" gradientUnits="userSpaceOnUse">
<stop stopColor="#4573DF"/>
<stop offset="1" stopColor="#2D4FA2"/>
</linearGradient>
<linearGradient id="paint20_linear_98_3" x1="237.5" y1="291" x2="2121.88" y2="2175.38" gradientUnits="userSpaceOnUse">
<stop stopColor="white"/>
<stop offset="0.5" stopColor="#EAF6FF"/>
<stop offset="1" stopColor="#CFE8EF"/>
</linearGradient>
<linearGradient id="paint21_linear_98_3" x1="297.656" y1="273.031" x2="5793.75" y2="5769.13" gradientUnits="userSpaceOnUse">
<stop stopColor="#4573DF"/>
<stop offset="1" stopColor="#2D4FA2"/>
</linearGradient>
<linearGradient id="paint22_linear_98_3" x1="303.125" y1="278.5" x2="4700" y2="4675.37" gradientUnits="userSpaceOnUse">
<stop stopColor="#4573DF"/>
<stop offset="1" stopColor="#2D4FA2"/>
</linearGradient>
<linearGradient id="paint23_linear_98_3" x1="315.625" y1="291" x2="2200" y2="2175.38" gradientUnits="userSpaceOnUse">
<stop stopColor="white"/>
<stop offset="0.5" stopColor="#EAF6FF"/>
<stop offset="1" stopColor="#CFE8EF"/>
</linearGradient>
</defs>
      </svg>
    </div>
  );
};

export default MegiLanceLogo;
