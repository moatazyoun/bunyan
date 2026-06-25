import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface BunyanLogoProps {
  className?: string;
  iconClassName?: string;
  barsClassName?: string;
  dotClassName?: string;
  size?: number; 
  color?: string;
}

export default function BunyanLogo({ 
  className = "w-10 h-10", 
  iconClassName = "fill-slate-800 dark:fill-slate-100",
  barsClassName = "fill-indigo-600 dark:fill-indigo-400",
  dotClassName = "fill-indigo-600 dark:fill-indigo-400",
  size,
  color
}: BunyanLogoProps) {
  const [isIntroFinished, setIsIntroFinished] = useState(false);
  const [clickForce, setClickForce] = useState(false);
  const dynamicSize = size ? { width: size, height: size } : {};

  const glowColor = color || "#6366f1";

  // Interactive 3D tilt variables for absolute premium tactile feel
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  // Smooth springs for rotation & scaling
  const rotateX = useSpring(useTransform(y, [0, 1], [15, -15]), { stiffness: 120, damping: 15 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-15, 15]), { stiffness: 120, damping: 15 });
  const scale = useSpring(1, { stiffness: 200, damping: 15 });
  const glowOpacity = useSpring(0.15, { stiffness: 120, damping: 15 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width || 1;
    const height = rect.height || 1;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseEnter = () => {
    scale.set(1.08);
    glowOpacity.set(0.85);
  };

  const handleMouseLeave = () => {
    scale.set(1);
    glowOpacity.set(0.15);
    x.set(0.5);
    y.set(0.5);
  };

  const handleClick = () => {
    setClickForce(true);
    setTimeout(() => setClickForce(false), 800);
  };

  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const pathVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { 
      pathLength: 1, 
      opacity: 1, 
      transition: { duration: 1.2, ease: "easeInOut" } 
    }
  };

  const barVariants = {
    initial: { scaleY: 0, opacity: 0, originY: 1 },
    animate: { 
      scaleY: 1, 
      opacity: 1, 
      transition: { duration: 0.8, ease: "backOut" } 
    }
  };

  const dotVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1, 
      transition: { duration: 0.5, type: "spring", stiffness: 200 } 
    }
  };

  return (
    <motion.div
      className={`relative cursor-pointer select-none inline-flex items-center justify-center ${className}`}
      style={{
        perspective: 1200,
        rotateX,
        rotateY,
        scale,
        transformStyle: "preserve-3d" as const,
        ...dynamicSize
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      whileTap={{ scale: 0.94 }}
    >
      <svg 
        className="w-full h-full overflow-visible pointer-events-none"
        viewBox="350 130 380 490" 
        xmlns="http://www.w3.org/2000/svg"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <defs>
          {/* Futuristic glowing aura for interactions */}
          <radialGradient id="aura-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glowColor} stopOpacity="0.5" />
            <stop offset="60%" stopColor={glowColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Dynamic Backlight Halo Glow inside the viewBox - Centered at coordinates (540, 370) */}
        <motion.circle
          cx="540"
          cy="370"
          r="190"
          fill="url(#aura-gradient)"
          style={{ 
            opacity: glowOpacity,
            transformOrigin: "540px 370px",
          }}
          animate={isIntroFinished ? {
            scale: clickForce ? [1, 1.4, 1] : [0.95, 1.12, 0.95],
          } : { scale: 0.8 }}
          transition={{
            scale: { 
              repeat: clickForce ? 0 : Infinity, 
              duration: clickForce ? 0.8 : 3.5, 
              ease: "easeInOut" 
            }
          }}
        />

        {/* Continuous ambient floating container for all graphic layers */}
        <motion.g
          animate={clickForce ? {
            scale: [1, 1.05, 0.98, 1],
            rotate: [0, -2, 2, 0]
          } : {
            y: [0, -8, 0],
            rotate: [-0.5, 0.5, -0.5]
          }}
          transition={clickForce ? {
            duration: 0.6,
            ease: "easeOut"
          } : {
            y: {
              repeat: Infinity,
              repeatType: "mirror" as const,
              duration: 4,
              ease: "easeInOut"
            },
            rotate: {
              repeat: Infinity,
              repeatType: "mirror" as const,
              duration: 6,
              ease: "easeInOut"
            }
          }}
        >
          {/* Main Building Body / Structure Outline */}
          <motion.path 
            className={`transition-colors duration-300 ${!color ? iconClassName : ""}`}
            fill={color || undefined}
            variants={pathVariants}
            onAnimationComplete={() => setIsIntroFinished(true)}
            style={{ transformOrigin: "540px 370px" }}
            animate={isIntroFinished ? {
              filter: clickForce ? [
                `drop-shadow(0 0 10px ${glowColor}7f)`,
                `drop-shadow(0 0 25px ${glowColor})`,
                `drop-shadow(0 0 10px ${glowColor}3f)`
              ] : [
                `drop-shadow(0 0 2px ${glowColor}1a)`,
                `drop-shadow(0 0 12px ${glowColor}44)`,
                `drop-shadow(0 0 2px ${glowColor}1a)`
              ]
            } : undefined}
            transition={isIntroFinished ? {
              filter: {
                repeat: clickForce ? 0 : Infinity,
                duration: clickForce ? 0.6 : 4,
                ease: "easeInOut"
              }
            } : undefined}
            d="
            M370.711121,174.999908 
            C370.710510,165.834488 370.689819,157.169006 370.729126,148.503784 
            C370.735840,147.021103 370.736511,145.449585 371.206940,144.079407 
            C371.853760,142.195541 373.441040,141.082504 375.503540,141.396500 
            C377.510895,141.702118 377.350067,143.471725 377.371460,144.957275 
            C377.539062,156.604706 378.088135,168.265411 377.710907,179.895798 
            C377.424500,188.726562 378.526276,197.529205 377.663055,206.358276 
            C377.241547,210.669754 378.985260,213.157074 384.048035,212.796570 
            C390.015015,212.371689 390.822327,211.987991 390.833038,206.221558 
            C390.867676,187.557709 390.845825,168.893738 390.853790,150.229813 
            C390.854431,148.731216 390.796600,147.218048 390.977417,145.737457 
            C391.259735,143.425354 392.242188,141.359222 394.873291,141.317398 
            C397.857452,141.269974 397.600616,143.913910 397.610077,145.750153 
            C397.710815,165.240555 397.843201,184.732971 397.648010,204.221649 
            C397.569946,212.014389 398.550171,213.261688 405.772644,212.607391 
            C409.846252,212.238373 411.006012,210.276291 410.973755,206.408279 
            C410.826385,188.745453 410.897888,171.080780 410.893402,153.416779 
            C410.892914,151.417130 410.875580,149.416641 410.925964,147.418045 
            C411.002716,144.371811 411.720245,141.221008 415.354797,141.397324 
            C419.011810,141.574722 417.979584,145.073013 417.988312,147.343750 
            C418.062408,166.673798 418.074402,186.004547 417.977234,205.334442 
            C417.955353,209.688812 417.927765,213.333405 424.067200,212.893768 
            C427.500031,212.647949 427.017700,215.891541 427.024841,218.112900 
            C427.072449,232.943695 427.416016,247.788574 426.871338,262.599731 
            C426.608459,269.749542 428.602386,274.928497 434.098419,279.464264 
            C439.865753,284.223877 444.975250,289.773041 450.503326,294.834045 
            C452.521942,296.682129 453.321899,298.700500 453.320740,301.404053 
            C453.298615,353.896027 453.300079,406.388092 453.434113,458.879791 
            C453.445190,463.217377 451.628906,464.290833 447.733307,464.202484 
            C439.905182,464.024841 432.070190,464.149811 424.238037,464.151947 
            C418.038147,464.153656 417.783264,463.932953 417.783722,457.669128 
            C417.787018,411.009338 417.793854,364.349548 417.839966,317.689789 
            C417.843353,314.249268 417.873657,310.944153 413.854828,309.363037 
            C411.964813,310.572144 412.456635,312.550415 412.455475,314.259460 
            C412.423462,361.919006 412.129852,409.581543 412.604767,457.236359 
            C412.752380,472.048431 411.079712,469.703369 425.385651,470.347443 
            C436.129364,470.831085 446.996796,470.992065 457.801666,470.019897 
            C460.709412,469.758270 462.757690,468.706024 464.621094,466.558929 
            C477.725220,451.459534 490.882690,436.406281 504.072632,421.381714 
            C505.679962,419.550873 506.516602,417.767212 506.516357,415.167542 
            C506.515747,408.832977 510.503845,404.642517 516.820557,403.626770 
            C522.248779,402.753845 527.707275,405.577667 529.483032,411.136322 
            C530.622681,414.703674 532.758911,416.650574 535.704651,418.398438 
            C545.005615,423.917175 554.199280,429.617157 563.515198,435.110107 
            C566.687744,436.980774 574.186584,435.489777 576.596802,432.738281 
            C583.072998,425.345276 589.493835,417.903748 595.968994,410.509857 
            C597.540405,408.715424 598.642517,406.913300 598.707275,404.326294 
            C598.873047,397.704010 601.845703,394.147461 608.314026,393.005005 
            C610.952515,392.538971 612.927795,391.588409 614.658997,389.581543 
            C637.613708,362.971863 660.646973,336.429810 683.570251,309.793060 
            C688.558594,303.996643 688.391602,303.859802 682.420471,298.773499 
            C681.544067,298.026947 680.556763,297.347473 680.283447,295.955811 
            C680.728821,293.819031 682.776001,293.572296 684.398743,292.994293 
            C693.026001,289.921387 701.676819,286.913147 710.346191,283.960724 
            C715.301270,282.273193 716.421997,283.329285 715.246643,288.552704 
            C713.239624,297.472137 711.099731,306.361847 709.126404,315.288513 
            C708.228027,319.352478 706.470703,319.224915 703.651489,316.919647 
            C698.057190,312.345215 697.814087,312.239258 692.986877,317.760284 
            C676.984131,336.063080 661.136841,354.501709 645.220642,372.880249 
            C639.443481,379.551147 633.659241,386.216156 627.840942,392.851074 
            C624.652405,396.487122 621.708618,399.896820 621.964050,405.466980 
            C622.206238,410.749695 617.200684,415.198212 611.052185,415.937866 
            C608.134521,416.288849 606.086548,417.451752 604.275513,419.551239 
            C597.857300,426.991608 591.442749,434.436127 584.931152,441.794434 
            C583.442444,443.476715 583.362915,445.311066 583.297241,447.341187 
            C583.094360,453.607452 579.008301,458.365417 573.246460,459.226318 
            C567.163391,460.135223 561.761047,456.763733 559.914185,450.484619 
            C559.252319,448.234406 558.309143,446.602509 556.309570,445.416962 
            C547.139160,439.979797 538.037659,434.425934 528.842224,429.031860 
            C523.487549,425.890778 515.341858,426.967651 511.318970,431.524597 
            C498.314026,446.255890 485.269806,460.959534 472.614166,475.988281 
            C468.406219,480.985199 464.047821,483.474121 457.312958,483.161774 
            C444.341339,482.560181 431.331085,482.806763 418.337433,482.652496 
            C415.653015,482.620636 413.223755,482.665741 413.095367,486.294525 
            C412.957703,490.187531 415.690155,489.908722 418.216583,489.909119 
            C490.205902,489.919647 562.195251,489.968323 634.184448,489.888275 
            C649.348938,489.871399 658.576782,480.295410 658.665588,464.999054 
            C658.727539,454.334290 658.698242,443.668854 658.674683,433.003784 
            C658.635254,415.156067 649.828796,406.424622 631.846619,406.294464 
            C630.083801,406.281708 628.186279,406.797180 626.053040,405.112091 
            C628.353271,400.757477 631.967651,397.335876 635.097473,393.628662 
            C642.510986,384.847504 650.209778,376.307434 657.630188,367.531952 
            C660.015259,364.711273 662.264587,364.135925 665.868103,365.342651 
            C695.089355,375.128113 711.260193,399.927612 712.881165,430.264252 
            C713.731812,446.185059 713.706665,462.212769 712.361206,478.197083 
            C709.436218,512.947632 683.487366,539.318848 648.762695,542.372925 
            C644.622131,542.737122 640.457764,543.019287 636.304321,543.020203 
            C558.315979,543.036560 480.327576,542.949646 402.339508,543.087280 
            C396.074280,543.098389 391.342560,541.584534 386.929047,536.881531 
            C379.070343,528.507385 370.593048,520.706421 362.237000,512.811218 
            C359.985779,510.684204 359.051086,508.423096 359.051178,505.358368 
            C359.053833,409.705811 359.018250,314.053253 358.884583,218.400833 
            C358.878510,214.049744 360.340881,212.204910 364.688416,212.696198 
            C369.309570,213.218430 370.853180,210.897583 370.780914,206.488678 
            C370.611511,196.161484 370.717072,185.829788 370.711121,174.999908 
            Z"
          />

          {/* Bar 1 - Tallest construction column */}
          <motion.path 
            className={`transition-colors duration-300 ${!color ? barsClassName : ""}`}
            fill={color || undefined}
            variants={barVariants}
            style={{ originY: 1 }}
            animate={isIntroFinished ? {
              scaleY: clickForce ? [1, 1.3, 0.9, 1] : [1, 0.88, 1.08, 0.92, 1],
              y: clickForce ? [0, -15, 5, 0] : [0, -3, 3, 0]
            } : undefined}
            whileHover={{
              scaleY: 1.25,
              transition: { type: "spring", stiffness: 300, damping: 10 }
            }}
            transition={isIntroFinished ? {
              scaleY: {
                repeat: clickForce ? 0 : Infinity,
                repeatType: clickForce ? undefined : "mirror" as const,
                duration: clickForce ? 0.6 : 3.8,
                ease: "easeInOut",
                delay: 0.1
              },
              y: {
                repeat: clickForce ? 0 : Infinity,
                repeatType: clickForce ? undefined : "mirror" as const,
                duration: clickForce ? 0.6 : 3.8,
                ease: "easeInOut",
                delay: 0.1
              }
            } : undefined}
            d="M637.255127,322.000000 
            C637.274963,331.656647 637.235474,340.814087 637.351074,349.969513 
            C637.386902,352.808075 636.521606,355.027252 634.631287,357.176270 
            C626.500427,366.419708 618.423157,375.714142 610.521362,385.153259 
            C607.792175,388.413452 603.598145,388.910187 600.449402,391.422424 
            C597.118225,394.080170 598.025269,399.059052 594.436340,401.364258 
            C592.024475,400.173706 592.810669,398.080444 592.808289,396.438019 
            C592.739014,349.821198 592.759399,303.204163 592.663269,256.587433 
            C592.656555,253.317200 593.690063,251.421768 596.748962,250.073685 
            C608.166443,245.041870 619.475708,239.765076 630.844849,234.622864 
            C636.366089,232.125641 637.218628,232.618042 637.228333,238.588547 
            C637.273132,266.225647 637.252686,293.862823 637.255127,322.000000 
            Z"
          />

          {/* Bar 2 - Middle construction column */}
          <motion.path 
            className={`transition-colors duration-300 ${!color ? barsClassName : ""}`}
            fill={color || undefined}
            variants={barVariants}
            style={{ originY: 1 }}
            animate={isIntroFinished ? {
              scaleY: clickForce ? [1, 1.35, 0.85, 1] : [1, 1.12, 0.88, 1.05, 1],
              y: clickForce ? [0, -20, 8, 0] : [0, -4, 4, 0]
            } : undefined}
            whileHover={{
              scaleY: 1.25,
              transition: { type: "spring", stiffness: 300, damping: 10 }
            }}
            transition={isIntroFinished ? {
              scaleY: {
                repeat: clickForce ? 0 : Infinity,
                repeatType: clickForce ? undefined : "mirror" as const,
                duration: clickForce ? 0.6 : 4.4,
                ease: "easeInOut",
                delay: 0.3
              },
              y: {
                repeat: clickForce ? 0 : Infinity,
                repeatType: clickForce ? undefined : "mirror" as const,
                duration: clickForce ? 0.6 : 4.4,
                ease: "easeInOut",
                delay: 0.3
              }
            } : undefined}
            d="M541.825806,331.001312 
            C541.829224,329.168976 541.834290,327.836090 541.831848,326.503235 
            C541.807068,313.247437 541.820007,313.278290 553.802673,308.135284 
            C562.523682,304.392120 571.202026,300.549652 579.904114,296.762268 
            C581.391602,296.114899 582.793701,295.015717 584.985046,295.881592 
            C586.454224,304.084229 585.649475,312.583099 585.750122,320.977295 
            C585.999695,341.790253 585.507141,362.611084 585.454895,383.429138 
            C585.433167,392.080383 586.276978,400.718292 585.672729,409.392700 
            C585.486267,412.069519 584.755981,414.056519 582.946899,416.024933 
            C579.570374,419.698853 576.470276,423.628723 573.293945,427.484039 
            C571.029846,430.232086 568.430054,430.711517 565.350159,428.918396 
            C558.442322,424.896637 551.539001,420.866119 544.588867,416.918427 
            C541.736450,415.298248 541.793335,412.692108 541.795837,409.973450 
            C541.820129,383.815887 541.818420,357.658356 541.825806,331.001312 
            Z"
          />

          {/* Bar 3 - Left construction column */}
          <motion.path 
            className={`transition-colors duration-300 ${!color ? barsClassName : ""}`}
            fill={color || undefined}
            variants={barVariants}
            style={{ originY: 1 }}
            animate={isIntroFinished ? {
              scaleY: clickForce ? [1, 1.4, 0.8, 1] : [1, 0.85, 1.15, 0.92, 1],
              y: clickForce ? [0, -22, 10, 0] : [0, -5, 5, 0]
            } : undefined}
            whileHover={{
              scaleY: 1.25,
              transition: { type: "spring", stiffness: 300, damping: 10 }
            }}
            transition={isIntroFinished ? {
              scaleY: {
                repeat: clickForce ? 0 : Infinity,
                repeatType: clickForce ? undefined : "mirror" as const,
                duration: clickForce ? 0.6 : 4.0,
                ease: "easeInOut",
                delay: 0.5
              },
              y: {
                repeat: clickForce ? 0 : Infinity,
                repeatType: clickForce ? undefined : "mirror" as const,
                duration: clickForce ? 0.6 : 4.0,
                ease: "easeInOut",
                delay: 0.5
              }
            } : undefined}
            d="M535.401855,345.110992 
            C535.442993,366.339417 535.442993,387.234985 535.442993,408.130585 
            C529.165527,401.951019 523.458496,396.282593 513.749695,398.895142 
            C504.219391,401.459717 502.504669,409.734711 500.701782,417.741272 
            C497.637634,416.332855 497.997681,414.677460 497.993683,413.249298 
            C497.948151,396.941864 498.042969,380.633026 497.847107,364.327637 
            C497.799805,360.392151 499.188690,358.344269 502.820618,356.838867 
            C512.037781,353.018433 521.066101,348.744568 530.218323,344.763397 
            C531.816223,344.068298 533.669250,342.118591 535.401855,345.110992 
            Z"
          />

          {/* Radiating high-tech beacon wave rings emanating from behind the dot focal-point */}
          <motion.circle
            cx="535"
            cy="575"
            r="24"
            fill="none"
            stroke={glowColor}
            strokeWidth="3"
            style={{ transformOrigin: "535px 575px" }}
            animate={{
              scale: clickForce ? [0.8, 3.8] : [1, 2.4],
              opacity: clickForce ? [0.9, 0] : [0.7, 0],
            }}
            transition={{
              duration: clickForce ? 0.7 : 2.0,
              repeat: clickForce ? 0 : Infinity,
              ease: "easeOut",
            }}
          />
          <motion.circle
            cx="535"
            cy="575"
            r="24"
            fill="none"
            stroke={glowColor}
            strokeWidth="1.5"
            style={{ transformOrigin: "535px 575px" }}
            animate={{
              scale: clickForce ? [0.8, 5.0] : [1, 3.4],
              opacity: clickForce ? [0.8, 0] : [0.55, 0],
            }}
            transition={{
              duration: clickForce ? 0.7 : 2.0,
              repeat: clickForce ? 0 : Infinity,
              ease: "easeOut",
              delay: clickForce ? 0 : 1.0,
            }}
          />

          {/* Dot - Represents the solid anchor of Bunyan */}
          <motion.path 
            className={`transition-colors duration-300 ${!color ? dotClassName : ""}`}
            fill={color || undefined}
            variants={dotVariants}
            style={{ originX: "535px", originY: "575px" }}
            animate={isIntroFinished ? {
              scale: clickForce ? [1, 1.45, 0.9, 1] : [1, 1.18, 1],
              filter: [
                `drop-shadow(0 0 2px ${glowColor}66)`,
                `drop-shadow(0 0 12px ${glowColor})`,
                `drop-shadow(0 0 2px ${glowColor}66)`
              ]
            } : undefined}
            whileHover={{
              scale: 1.35,
              y: -10,
              transition: { type: "spring", stiffness: 450, damping: 12 }
            }}
            transition={isIntroFinished ? {
              scale: { 
                repeat: clickForce ? 0 : Infinity, 
                duration: clickForce ? 0.6 : 2.5, 
                ease: "easeInOut" 
              },
              filter: { 
                repeat: clickForce ? 0 : Infinity, 
                duration: clickForce ? 0.6 : 2.5, 
                ease: "easeInOut" 
              }
            } : undefined}
            d="M524.009094,595.213318 
            C515.110474,588.673157 511.275238,580.327942 513.861084,569.786865 
            C516.055054,560.843140 521.833069,555.026489 530.854675,552.648376 
            C541.130676,549.939514 551.411011,553.979553 557.262207,563.007935 
            C562.750244,571.476074 562.013123,582.622864 555.451355,590.388428 
            C548.658020,598.428040 537.551636,601.190186 527.878174,597.208923 
            C526.654358,596.705322 525.507996,596.013306 524.009094,595.213318 
            Z"
          />

          {/* Ambient floating technological stars/particles around the construction */}
          <motion.circle
            cx="680"
            cy="260"
            r="4.5"
            fill={glowColor}
            animate={{
              y: [0, -18, 0],
              opacity: [0.2, 0.9, 0.2],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              duration: 4.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.circle
            cx="395"
            cy="285"
            r="3"
            fill={glowColor}
            animate={{
              y: [0, -22, 0],
              opacity: [0.15, 0.8, 0.15],
              scale: [0.7, 1.2, 0.7],
            }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.2,
            }}
          />
        </motion.g>
      </svg>
    </motion.div>
  );
}
