/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Search, 
  Database,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Upload,
  Sparkles,
  Loader2,
  Printer
} from 'lucide-react';
import { BOQItem, Project } from '../types';
import { confirmWithRandomCode } from '../utils/confirmHelper';

interface BOQTabProps {
  projectId: string; // Site ID
  projects: Project[];
  setProjects?: (projects: Project[]) => void;
  boqItems: BOQItem[];
  setBoqItems: (items: BOQItem[]) => void;
  userRole?: string;
}

export default function BOQTab({ projectId, projects, setProjects, boqItems, setBoqItems, userRole }: BOQTabProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Unified Form Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    code: '',
    description: '',
    unit: 'م٣',
    quantity: 0,
    price: 0
  });

  // Custom Unit input visibility
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnitText, setCustomUnitText] = useState('');

  // Sync selectedProjectId whenever the list of projects updates/loads
  React.useEffect(() => {
    if (projects.length > 0) {
      const exists = projects.some(p => p.id === selectedProjectId);
      if (!selectedProjectId || !exists) {
        setSelectedProjectId(projects[0].id);
      }
    } else {
      setSelectedProjectId('');
    }
  }, [projects, selectedProjectId]);
  
  // AI-powered BOQ upload states
  const [showAiUploader, setShowAiUploader] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [extractedItems, setExtractedItems] = useState<any[]>([]);
  const [editingExtractedId, setEditingExtractedId] = useState<string | null>(null);

  // Print Settings States
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printPaperSize, setPrintPaperSize] = useState<'A4' | 'A3'>('A4');
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // helper to convert number to Arabic words (Tafqit)
  const tafqitArabic = (num: number): string => {
    if (num === 0) return 'صفر جنيه مصري';
    
    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
    const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
    
    const getUnderThousand = (n: number): string => {
      let result = '';
      const h = Math.floor(n / 100);
      const rem = n % 100;
      
      if (h > 0) {
        result += hundreds[h];
      }
      
      if (rem > 0) {
        if (result) result += ' و ';
        if (rem < 20) {
          result += ones[rem];
        } else {
          const t = Math.floor(rem / 10);
          const o = rem % 10;
          if (o > 0) {
            result += ones[o] + ' و ' + tens[t];
          } else {
            result += tens[t];
          }
        }
      }
      return result;
    };

    const parts: string[] = [];
    let temp = Math.floor(num);
    
    // Millions
    const millions = Math.floor(temp / 1000000);
    temp %= 1000000;
    if (millions > 0) {
      if (millions === 1) parts.push('مليون');
      else if (millions === 2) parts.push('مليونان');
      else if (millions >= 3 && millions <= 10) parts.push(getUnderThousand(millions) + ' ملايين');
      else parts.push(getUnderThousand(millions) + ' مليون');
    }
    
    // Thousands
    const thousands = Math.floor(temp / 1000);
    temp %= 1000;
    if (thousands > 0) {
      if (thousands === 1) parts.push('ألف');
      else if (thousands === 2) parts.push('ألفان');
      else if (thousands >= 3 && thousands <= 10) parts.push(getUnderThousand(thousands) + ' آلاف');
      else parts.push(getUnderThousand(thousands) + ' ألف');
    }
    
    // Ones
    if (temp > 0) {
      parts.push(getUnderThousand(temp));
    }
    
    let formatted = parts.join(' و ');
    const piastres = Math.round((num % 1) * 100);
    let piastresText = '';
    if (piastres > 0) {
      piastresText = ` و ${getUnderThousand(piastres)} قرشاً`;
    }
    
    return 'فقط وقدره ' + formatted + ' جنيهاً مصرياً لا غير' + piastresText;
  };

  const handlePrintBOQ = (paperSize: 'A4' | 'A3', orientation: 'portrait' | 'landscape') => {
    // Create an iframe to hold the printable content
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    let targetMinHeight = '180mm';
    if (paperSize === 'A4') {
      targetMinHeight = orientation === 'landscape' ? '180mm' : '262mm';
    } else if (paperSize === 'A3') {
      targetMinHeight = orientation === 'landscape' ? '262mm' : '385mm';
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const itemsRows = activeBoqItems.map((item) => `
      <tr class="border-b border-slate-950 text-slate-950 text-xs hover:bg-slate-50/50" style="page-break-inside: avoid; break-inside: avoid;">
        <td class="p-2 text-right font-bold leading-relaxed border border-slate-950">${item.description}</td>
        <td class="p-2 text-center font-bold border border-slate-950">${item.unit}</td>
        <td class="p-2 text-center font-bold font-mono border border-slate-950">${item.quantity.toLocaleString('en-US')}</td>
        <td class="p-2 text-center font-bold font-mono text-emerald-800 border border-slate-950">${item.price.toLocaleString('en-US')}</td>
        <td class="p-2 text-center font-black font-mono text-slate-950 border border-slate-950">${(item.quantity * item.price).toLocaleString('en-US')}</td>
      </tr>
    `).join('');

    const formattedTotal = totalBoqValue.toLocaleString('en-US');
    const writtenTotal = tafqitArabic(totalBoqValue);
    const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>طباعة جدول الكميات والمقايسة</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Tajawal', 'sans-serif'],
                }
              }
            }
          }
        </script>
        <style>
          @page {
            size: ${paperSize} ${orientation};
            margin: 10mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white !important;
            }
          }
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: 'Tajawal', sans-serif;
            background-color: white;
            box-sizing: border-box;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        </style>
      </head>
      <body class="p-1 bg-white text-slate-950">
        <!-- Outer Frame -->
        <div class="border-[4px] border-slate-950 p-5 flex flex-col justify-between box-border rounded-3xl" dir="rtl" style="min-height: ${targetMinHeight}; max-width: 100%;">
          <div>
            <!-- Header Block -->
            <div class="grid grid-cols-3 gap-4 items-center border-b-2 border-slate-950 pb-4 mb-6">
              <div class="text-right space-y-1 text-xs font-bold leading-relaxed">
                <h1 class="text-sm font-black text-slate-950">شركة بنيان للتشييد والتطوير العقاري</h1>
                <p class="text-[10px] font-black text-slate-600">إدارة المشروعات والرقابة الهندسية والمقايسات</p>
                <p class="text-[9px] text-slate-500">تاريخ الطباعة: ${dateStr}</p>
              </div>
              
              <div class="text-center flex flex-col items-center justify-center">
                <div class="inline-block p-1.5 bg-white border border-slate-300 rounded-xl shadow-xs">
                  <svg viewBox="350 130 380 490" xmlns="http://www.w3.org/2000/svg" style="width: 50px; height: 50px; display: block; margin: 0 auto;">
                    <!-- Main Body -->
                    <path fill="#0f172a" d="M370.711121,174.999908 C370.710510,165.834488 370.689819,157.169006 370.729126,148.503784 C370.735840,147.021103 370.736511,145.449585 371.206940,144.079407 C371.853760,142.195541 373.441040,141.082504 375.503540,141.396500 C377.510895,141.702118 377.350067,143.471725 377.371460,144.957275 C377.539062,156.604706 378.088135,168.265411 377.710907,179.895798 C377.424500,188.726562 378.526276,197.529205 377.663055,206.358276 C377.241547,210.669754 378.985260,213.157074 384.048035,212.796570 C390.015015,212.371689 390.822327,211.987991 390.833038,206.221558 C390.867676,187.557709 390.845825,168.893738 390.853790,150.229813 C390.854431,148.731216 390.796600,147.218048 390.977417,145.737457 C391.259735,143.425354 392.242188,141.359222 394.873291,141.317398 C397.857452,141.269974 397.600616,143.913910 397.610077,145.750153 C397.710815,165.240555 397.843201,184.732971 397.648010,204.221649 C397.569946,212.014389 398.550171,213.261688 405.772644,212.607391 C409.846252,212.238373 411.006012,210.276291 410.973755,206.408279 C410.826385,188.745453 410.897888,171.080780 410.893402,153.416779 C410.892914,151.417130 410.875580,149.416641 410.925964,147.418045 C411.002716,144.371811 411.720245,141.221008 415.354797,141.397324 C419.011810,141.574722 417.979584,145.073013 417.988312,147.343750 C418.062408,166.673798 418.074402,186.004547 417.977234,205.334442 C417.955353,209.688812 417.927765,213.333405 424.067200,212.893768 C427.500031,212.647949 427.017700,215.891541 427.024841,218.112900 C427.072449,232.943695 427.416016,247.788574 426.871338,262.599731 C426.608459,269.749542 428.602386,274.928497 434.098419,279.464264 C439.865753,284.223877 444.975250,289.773041 450.503326,294.834045 C452.521942,296.682129 453.321899,298.700500 453.320740,301.404053 C453.298615,353.896027 453.300079,406.388092 453.434113,458.879791 C453.445190,463.217377 451.628906,464.290833 447.733307,464.202484 C439.905182,464.024841 432.070190,464.149811 424.238037,464.151947 C418.038147,464.153656 417.783264,463.932953 417.783722,457.669128 C417.787018,411.009338 417.793854,364.349548 417.839966,317.689789 C417.843353,314.249268 417.873657,310.944153 413.854828,309.363037 C411.964813,310.572144 412.456635,312.550415 412.455475,314.259460 C412.423462,361.919006 412.129852,409.581543 412.604767,457.236359 C412.752380,472.048431 411.079712,469.703369 425.385651,470.347443 C436.129364,470.831085 446.996796,470.992065 457.801666,470.019897 C460.709412,469.758270 462.757690,468.706024 464.621094,466.558929 C477.725220,451.459534 490.882690,436.406281 504.072632,421.381714 C505.679962,419.550873 506.516602,417.767212 506.516357,415.167542 C506.515747,408.832977 510.503845,404.642517 516.820557,403.626770 C522.248779,402.753845 527.707275,405.577667 529.483032,411.136322 C530.622681,414.703674 532.758911,416.650574 535.704651,418.398438 C545.005615,423.917175 554.199280,429.617157 563.515198,435.110107 C566.687744,436.980774 574.186584,435.489777 576.596802,432.738281 C583.072998,425.345276 589.493835,417.903748 595.968994,410.509857 C597.540405,408.715424 598.642517,406.913300 598.707275,404.326294 C598.873047,397.704010 601.845703,394.147461 608.314026,393.005005 C610.952515,392.538971 612.927795,391.588409 614.658997,389.581543 C637.613708,362.971863 660.646973,336.429810 683.570251,309.793060 C688.558594,303.996643 688.391602,303.859802 682.420471,298.773499 C681.544067,298.026947 680.556763,297.347473 680.283447,295.955811 C680.728821,293.819031 682.776001,293.572296 684.398743,292.994293 C693.026001,289.921387 701.676819,286.913147 710.346191,283.960724 C715.301270,282.273193 716.421997,283.329285 715.246643,288.552704 C713.239624,297.472137 711.099731,306.361847 709.126404,315.288513 C708.228027,319.352478 706.470703,319.224915 703.651489,316.919647 C698.057190,312.345215 697.814087,312.239258 692.986877,317.760284 C676.984131,336.063080 661.136841,354.501709 645.220642,372.880249 C639.443481,379.551147 633.659241,386.216156 627.840942,392.851074 C624.652405,396.487122 621.708618,399.896820 621.964050,405.466980 C622.206238,410.749695 617.200684,415.198212 611.052185,415.937866 C608.134521,416.288849 606.086548,417.451752 604.275513,419.551239 C597.857300,426.991608 591.442749,434.436127 584.931152,441.794434 C583.442444,443.476715 583.362915,445.311066 583.297241,447.341187 C583.094360,453.607452 579.008301,458.365417 573.246460,459.226318 C567.163391,460.135223 561.761047,456.763733 559.914185,450.484619 C559.252319,448.234406 558.309143,446.602509 556.309570,445.416962 C547.139160,439.979797 538.037659,434.425934 528.842224,429.031860 C523.487549,425.890778 515.341858,426.967651 511.318970,431.524597 C498.314026,446.255890 485.269806,460.959534 472.614166,475.988281 C468.406219,480.985199 464.047821,483.474121 457.312958,483.161774 C444.341339,482.560181 431.331085,482.806763 418.337433,482.652496 C415.653015,482.620636 413.223755,482.665741 413.095367,486.294525 C412.957703,490.187531 415.690155,489.908722 418.216583,489.909119 C490.205902,489.919647 562.195251,489.968323 634.184448,489.888275 C649.348938,489.871399 658.576782,480.295410 658.665588,464.999054 C658.727539,454.334290 658.698242,443.668854 658.674683,433.003784 C658.635254,415.156067 649.828796,406.424622 631.846619,406.294464 C630.083801,406.281708 628.186279,406.797180 626.053040,405.112091 C628.353271,400.757477 631.967651,397.335876 635.097473,393.628662 C642.510986,384.847504 650.209778,376.307434 657.630188,367.531952 C660.015259,364.711273 662.264587,364.135925 665.868103,365.342651 C695.089355,375.128113 711.260193,399.927612 712.881165,430.264252 C713.731812,446.185059 713.706665,462.212769 712.361206,478.197083 C709.436218,512.947632 683.487366,539.318848 648.762695,542.372925 C644.622131,542.737122 640.457764,543.019287 636.304321,543.020203 C558.315979,543.036560 480.327576,542.949646 402.339508,543.087280 C396.074280,543.098389 391.342560,541.584534 386.929047,536.881531 C379.070343,528.507385 370.593048,520.706421 362.237000,512.811218 C359.985779,510.684204 359.051086,508.423096 359.051178,505.358368 C359.053833,409.705811 359.018250,314.053253 358.884583,218.400833 C358.878510,214.049744 360.340881,212.204910 364.688416,212.696198 C369.309570,213.218430 370.853180,210.897583 370.780914,206.488678 C370.611511,196.161484 370.717072,185.829788 370.711121,174.999908 Z" />
                    <!-- Bar 1 -->
                    <path fill="#4f46e5" d="M637.255127,322.000000 C637.274963,331.656647 637.235474,340.814087 637.351074,349.969513 C637.386902,352.808075 636.521606,355.027252 634.631287,357.176270 C626.500427,366.419708 618.423157,375.714142 610.521362,385.153259 C607.792175,388.413452 603.598145,388.910187 600.449402,391.422424 C597.118225,394.080170 598.025269,399.059052 594.436340,401.364258 C592.024475,400.173706 592.810669,398.080444 592.808289,396.438019 C592.739014,349.821198 592.759399,303.204163 592.663269,256.587433 C592.656555,253.317200 593.690063,251.421768 596.748962,250.073685 C608.166443,245.041870 619.475708,239.765076 630.844849,234.622864 C636.366089,232.125641 637.218628,232.618042 637.228333,238.588547 C637.273132,266.225647 637.252686,293.862823 637.255127,322.000000 Z" />
                    <!-- Bar 2 -->
                    <path fill="#4f46e5" d="M541.825806,331.001312 C541.829224,329.168976 541.834290,327.836090 541.831848,326.503235 C541.807068,313.247437 541.820007,313.278290 553.802673,308.135284 C562.523682,304.392120 571.202026,300.549652 579.904114,296.762268 C581.391602,296.114899 582.793701,295.015717 584.985046,295.881592 C586.454224,304.084229 585.649475,312.583099 585.750122,320.977295 C585.999695,341.790253 585.507141,362.611084 585.454895,383.429138 C585.433167,392.080383 586.276978,400.718292 585.672729,409.392700 C585.486267,412.069519 584.755981,414.056519 582.946899,416.024933 C579.570374,419.698853 576.470276,423.628723 573.293945,427.484039 C571.029846,430.232086 568.430054,430.711517 565.350159,428.918396 C558.442322,424.896637 551.539001,420.866119 544.588867,416.918427 C541.736450,415.298248 541.793335,412.692108 541.795837,409.973450 C541.820129,383.815887 541.818420,357.658356 541.825806,331.001312 Z" />
                    <!-- Bar 3 -->
                    <path fill="#4f46e5" d="M535.401855,345.110992 C535.442993,366.339417 535.442993,387.234985 535.442993,408.130585 C529.165527,401.951019 523.458496,396.282593 513.749695,398.895142 C504.219391,401.459717 502.504669,409.734711 500.701782,417.741272 C497.637634,416.332855 497.997681,414.677460 497.993683,413.249298 C497.948151,396.941864 498.042969,380.633026 497.847107,364.327637 C497.799805,360.392151 499.188690,358.344269 502.820618,356.838867 C512.037781,353.018433 521.066101,348.744568 530.218323,344.763397 C531.816223,344.068298 533.669250,342.118591 535.401855,345.110992 Z" />
                    <!-- Dot -->
                    <path fill="#4f46e5" d="M524.009094,595.213318 C515.110474,588.673157 511.275238,580.327942 513.861084,569.786865 C516.055054,560.843140 521.833069,555.026489 530.854675,552.648376 C541.130676,549.939514 551.411011,553.979553 557.262207,563.007935 C562.750244,571.476074 562.013123,582.622864 555.451355,590.388428 C548.658020,598.428040 537.551636,601.190186 527.878174,597.208923 C526.654358,596.705322 525.507996,596.013306 524.009094,595.213318 Z" />
                  </svg>
                  <span class="text-[8px] font-black text-slate-800 block text-center mt-0.5">BUNYAN CO.</span>
                </div>
              </div>

              <div class="text-left text-xs space-y-1 font-bold">
                <p>الموقع النشط: <span class="font-black text-indigo-900">${activeProject?.name || '---'}</span></p>
                <p class="text-[10px] text-slate-700">كود الإسناد: ${activeProject?.assignmentNumber || '---'}</p>
                <p class="text-[10px] text-slate-700">تاريخ الإسناد: ${activeProject ? new Date(activeProject.assignmentDate).toLocaleDateString('ar-EG') : '---'}</p>
              </div>
            </div>

            <!-- Page Title -->
            <div class="text-center my-6">
              <h2 class="text-xl font-black text-slate-950 border-b-[3px] border-indigo-600 inline-block pb-1.5 px-8 uppercase tracking-wider">
                جدول الكميات وفئات الأعمال (المقايسة المعتمدة)
              </h2>
              <p class="text-xs font-black text-indigo-950 mt-2">عقد إسناد رقم: ${activeProject?.assignmentNumber || '---'}</p>
            </div>

            <!-- BOQ Table -->
            <div class="mt-4 overflow-x-auto">
              <table class="w-full text-right text-xs border-collapse border-[1.2px] border-slate-950">
                <thead>
                  <tr class="bg-slate-100 border-b border-slate-950 text-slate-950 font-black">
                    <th class="w-[60%] p-2.5 border border-slate-950 font-black text-right">بيان الأعمال والمواصفات الفنية المعتمدة</th>
                    <th class="w-[8%] p-2.5 border border-slate-950 text-center font-black">الوحدة</th>
                    <th class="w-[10%] p-2.5 border border-slate-950 text-center font-black">الكمية</th>
                    <th class="w-[10%] p-2.5 border border-slate-950 text-center font-black">الفئة (ج.م)</th>
                    <th class="w-[12%] p-2.5 border border-slate-950 text-center font-black">الإجمالي (ج.م)</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                  <!-- Total Row -->
                  <tr class="bg-slate-100 border-t-2 border-slate-950 text-xs font-black h-12">
                    <td colspan="4" class="p-3 border border-slate-950 text-right text-slate-950 font-black">
                      إجمالي قيمة المقايسة المعتمدة:
                    </td>
                    <td colspan="2" class="p-3 border border-slate-950 text-center text-indigo-900 font-mono text-sm bg-slate-200">
                      ${formattedTotal} ج.م
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Tafqit box -->
            <div class="mt-4 p-4 bg-slate-50 border border-slate-400 rounded-xl">
              <p class="text-xs font-black text-slate-950 leading-relaxed">
                <span class="text-indigo-900 font-black">فقط وقدره:</span> ${writtenTotal}
              </p>
            </div>

            <!-- Important Notes -->
            <div class="mt-6 text-[10px] text-slate-600 space-y-1 leading-relaxed">
              <p class="font-black text-slate-800">ملاحظات هامة للجهات الفنية والمالية:</p>
              <ul class="list-disc list-inside space-y-0.5 pr-2 font-bold">
                <li>تعتمد هذه المقايسة كمرجع أساسي لحصر كميات الأعمال المنفذة على الطبيعة وصرف المستخلصات الجارية والختامية لمهندسي الموقع.</li>
                <li>تخضع فئات الأسعار المدرجة أعلاه لشروط عقد التكلفة المتفق عليه مع الإدارة المركزية لشركة بنيان.</li>
                <li>لا يجوز تخطي الكميات التعاقدية دون موافقة كتابية رسمية من قطاع الدعم الفني والمكتب الفني بالمركز الرئيسي.</li>
              </ul>
            </div>
          </div>

          <!-- Signatures Section -->
          <div class="mt-12 grid grid-cols-4 gap-6 text-center text-xs font-bold text-slate-800 pt-6 border-t border-slate-300">
            <div class="space-y-12">
              <p class="font-black text-slate-900">مهندس موقع التنفيذ</p>
              <p class="border-t border-dashed border-slate-400 pt-1.5 w-5/6 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-12">
              <p class="font-black text-slate-900">المكتب الفني ومراجع التكاليف</p>
              <p class="border-t border-dashed border-slate-400 pt-1.5 w-5/6 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-12">
              <p class="font-black text-slate-900">مدير المشروع الميداني</p>
              <p class="border-t border-dashed border-slate-400 pt-1.5 w-5/6 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
            <div class="space-y-12">
              <p class="font-black text-slate-900">اعتماد مدير عام المشروعات</p>
              <p class="border-t border-dashed border-slate-400 pt-1.5 w-5/6 mx-auto">الاسم والتوقيع: .....................</p>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.frameElement.remove();
              }, 500);
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();
  };

  const activeProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const activeBoqItems = useMemo(() => boqItems.filter(item => item.projectId === selectedProjectId || item.projectId === projectId), [boqItems, selectedProjectId, projectId]);
  
  const filteredItems = useMemo(() => activeBoqItems.filter(item => 
    (item.description || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
    (item.code || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  ), [activeBoqItems, searchTerm]);

  const ensureDefaultProject = (): string => {
    if (projects.length > 0) {
      return projectId || projects[0].id;
    }
    
    // Ensure default project if projects list is empty
    const defaultProjId = `proj-default`;
    if (setProjects) {
      const defaultProject: Project = {
        id: defaultProjId,
        name: 'العملية الافتراضية للموقع',
        assignmentNumber: 'إسناد داخلي مباشر / 01',
        assignmentDate: new Date().toISOString().split('T')[0],
        handoverDate: new Date().toISOString().split('T')[0],
        durationMonths: 12,
        status: 'Active'
      };
      setProjects([defaultProject]);
      setSelectedProjectId(defaultProjId);
    }
    return defaultProjId;
  };

  if (projects.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 text-center px-4 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-indigo-50 rounded-[30px] flex items-center justify-center mx-auto border-4 border-white shadow-xl">
          <Briefcase className="w-10 h-10 text-indigo-600" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">لا توجد مشروعات مسجلة في هذا الموقع</h2>
          <p className="text-slate-500 text-sm font-bold leading-relaxed">
            يرجى التوجه لعلامة تبويب <span className="text-indigo-600 font-black">"المشروعات والإسناد"</span> لإنشاء وتسجيل أول مشروع/عملية حتى تتمكن من عرض وتسجيل بنود المقايسة الفنية الخاصة بها بشكل متزامن مع قاعدة البيانات السحابية.
          </p>
        </div>
      </div>
    );
  }

  // Open Form Modal for adding
  const handleOpenAddModal = () => {
    if (userRole === 'viewer') {
      alert('عذراً، لا تملك صلاحية إضافة بنود');
      return;
    }
    setEditingId(null);
    setFormState({
      code: '',
      description: '',
      unit: 'م٣',
      quantity: 0,
      price: 0
    });
    setIsCustomUnit(false);
    setCustomUnitText('');
    setShowFormModal(true);
  };

  // Open Form Modal for editing
  const handleOpenEditModal = (item: BOQItem) => {
    if (userRole === 'viewer') {
      alert('عذراً، لا تملك صلاحية تعديل البنود');
      return;
    }
    setEditingId(item.id);
    
    // Check if unit is a standard one
    const standardUnits = ['م٣', 'م٢', 'م.ط', 'عدد', 'مقطوعية', 'طن', 'كجم'];
    const isStd = standardUnits.includes(item.unit);
    
    setFormState({
      code: item.code,
      description: item.description,
      unit: isStd ? item.unit : 'custom',
      quantity: item.quantity,
      price: item.price
    });

    if (!isStd) {
      setIsCustomUnit(true);
      setCustomUnitText(item.unit);
    } else {
      setIsCustomUnit(false);
      setCustomUnitText('');
    }
    setShowFormModal(true);
  };

  // Save Add/Edit action
  const handleSaveItem = () => {
    if (!formState.description || !formState.code) {
      alert('الرجاء تعبئة الحقول الإجبارية: كود البند ووصف البند');
      return;
    }

    let finalUnit = formState.unit;
    if (formState.unit === 'custom') {
      finalUnit = customUnitText.trim() || 'م٣';
    }
    
    let targetProjectId = selectedProjectId;
    if (!targetProjectId) {
      targetProjectId = ensureDefaultProject();
    }
    
    if (editingId) {
      // Edit Mode
      const updatedItems = boqItems.map(item => 
        item.id === editingId 
          ? { 
              ...item, 
              code: formState.code, 
              description: formState.description, 
              unit: finalUnit, 
              quantity: formState.quantity, 
              price: formState.price 
            } 
          : item
      );
      setBoqItems(updatedItems);
    } else {
      // Add Mode
      const itemToAdd: BOQItem = {
        id: `boq-${Date.now()}`,
        projectId: targetProjectId,
        code: formState.code,
        description: formState.description,
        unit: finalUnit,
        quantity: formState.quantity,
        price: formState.price
      };
      setBoqItems([...boqItems, itemToAdd]);
    }
    
    // Reset and Close
    setShowFormModal(false);
    setEditingId(null);
    setFormState({ code: '', description: '', unit: 'م٣', quantity: 0, price: 0 });
    setIsCustomUnit(false);
    setCustomUnitText('');
  };

  const handleDeleteItem = async (id: string) => {
    if (userRole === 'viewer') {
      alert('عذراً، لا تملك صلاحية الحذف');
      return;
    }
    if (await confirmWithRandomCode('هل أنت متأكد من حذف هذا البند من المقايسة؟ قد يؤثر ذلك على المستخلصات المرتبطة.')) {
      setBoqItems(boqItems.filter(item => item.id !== id));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setExtractedItems([]);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const res = await fetch("/api/gemini/analyze-boq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64: base64String,
            mimeType: file.type
          })
        });

        if (!res.ok) {
          let errData;
          try { errData = await res.json(); } catch {}
          throw new Error((errData && errData.error) || "فشل تحليل المستند.");
        }

        const streamReader = res.body?.getReader();
        const decoder = new TextDecoder();
        let resultText = '';
        if (streamReader) {
          while (true) {
            const { done, value } = await streamReader.read();
            if (done) break;
            resultText += decoder.decode(value, { stream: true });
          }
        }
        
        let data: any = {};
        try {
          data = JSON.parse(resultText);
        } catch (err) {
          throw new Error("فشل في تحليل المخرجات الواردة من الذكاء الاصطناعي.");
        }
        if (data.items && Array.isArray(data.items)) {
          const mapped = data.items.map((it: any, index: number) => ({
            id: `temp-${Date.now()}-${index}`,
            code: it.code || '',
            description: it.description || '',
            unit: it.unit || 'م٣',
            quantity: Number(it.quantity) || 0,
            price: Number(it.price) || 0
          }));
          setExtractedItems(mapped);
        } else {
          throw new Error("لم يتم العثور على بنود صالحة في المقايسة.");
        }
      } catch (err: any) {
        console.error(err);
        setAnalysisError(err.message || 'حدث خطأ أثناء تواصل نظام الذكاء الاصطناعي مع الخدمة السحابية.');
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.onerror = () => {
      setAnalysisError("فشل قراءة ملف الـ PDF.");
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateExtracted = (id: string, updates: any) => {
    setExtractedItems(extractedItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleSaveExtractedItems = () => {
    let targetProjectId = selectedProjectId || (projects[0] && projects[0].id);
    if (!targetProjectId) {
      targetProjectId = ensureDefaultProject();
    }
    if (extractedItems.length === 0) return;

    const itemsToAdd: BOQItem[] = extractedItems.map(it => ({
      id: `boq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      projectId: targetProjectId,
      code: it.code,
      description: it.description,
      unit: it.unit,
      quantity: it.quantity,
      price: it.price
    }));

    setBoqItems([...boqItems, ...itemsToAdd]);
    setExtractedItems([]);
    setShowAiUploader(false);
  };

  const totalBoqValue = useMemo(() => activeBoqItems.reduce((sum, item) => sum + (item.quantity * item.price), 0), [activeBoqItems]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      
      {/* Summary Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1 w-full">
          <div className="p-3 bg-purple-600 rounded-2xl text-white">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="flex-1 w-full">
            <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-wider">العملية النشطة وموقع المقايسة</label>
            <select 
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-black outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer text-slate-900"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name} - ({p.assignmentNumber})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="h-12 w-[1px] bg-slate-100 hidden md:block" />
        <div className="flex gap-8 px-4 justify-between w-full md:w-auto">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase">قيمة العملية المعتمدة</p>
            <p className="text-xl font-black text-slate-900 mt-1">{totalBoqValue.toLocaleString()} <span className="text-xs">ج.م</span></p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase">تاريخ التعاقد</p>
            <p className="text-sm font-black text-slate-700 mt-1">{activeProject ? new Date(activeProject.assignmentDate).toLocaleDateString('ar-EG') : '---'}</p>
          </div>
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-purple-600 rounded-3xl p-6 text-white shadow-lg shadow-purple-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black">إجمالي قيمة المقايسة</h3>
          </div>
          <div className="text-3xl font-black mb-1 tabular-nums">
            {totalBoqValue.toLocaleString('en-US')}
            <span className="text-sm font-bold opacity-60 mr-2">ج.م</span>
          </div>
          <p className="text-[10px] font-bold opacity-70">القيمة التقديرية لكافة البنود المدرجة</p>
        </div>
        
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs border-b-4 border-b-purple-600">
          <div className="flex items-center gap-3 mb-4 text-slate-400">
            <div className="p-2 bg-purple-50 rounded-xl">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-sm font-black text-slate-800">عدد البنود الإجمالي</h3>
          </div>
          <div className="text-3xl font-black text-slate-900 tabular-nums">
            {activeBoqItems.length}
            <span className="text-sm font-bold text-slate-400 mr-2">بند هندسي</span>
          </div>
          <p className="text-[10px] font-bold text-slate-500 mt-1 font-mono">مسجلة في قاعدة بيانات الموقع</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs border-b-4 border-b-teal-600">
          <div className="flex items-center gap-3 mb-4 text-slate-400">
            <div className="p-2 bg-teal-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="text-sm font-black text-slate-800">الحالة التعاقدية للموقع</h3>
          </div>
          <div className="text-xl font-black text-teal-700">
            مقايسة فنية معتمدة
          </div>
          <p className="text-[10px] font-bold text-slate-500 mt-1">جاهزة ومؤمنة لسحب مستخلصات الأعمال</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[24px] border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="بحث برقم البند أو الوصف..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-3 text-xs font-bold outline-none focus:border-purple-500 focus:bg-white transition-all shadow-none"
              />
            </div>
            
            <button 
              onClick={handleOpenAddModal}
              disabled={userRole === 'viewer'}
              className="px-5 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs font-black bg-purple-600 text-white hover:bg-purple-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة بند يدوي</span>
            </button>

            <button 
              onClick={() => {
                setShowAiUploader(!showAiUploader);
              }}
              className={`px-5 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs font-black border
                ${showAiUploader ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}
              `}
            >
              <Sparkles className="w-4 h-4" />
              <span>الذكاء الاصطناعي مراجع التكاليف</span>
            </button>

            <button 
              onClick={() => setShowPrintModal(true)}
              className="px-5 py-3 rounded-2xl bg-slate-900 text-white hover:bg-black transition-all flex items-center justify-center gap-2 text-xs font-black"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة المقايسة</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] font-black text-purple-600 px-4 py-2 bg-purple-50 rounded-2xl">
             <AlertCircle className="w-4 h-4 text-purple-500" />
             تعديل سعر البند ينعكس فوراً على المستخلصات الحالية غير المصروفة
          </div>
        </div>

        {/* AI Uploader Section */}
        {showAiUploader && (
          <div className="p-6 bg-slate-50 border-b border-slate-100 animate-in slide-in-from-top duration-300">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-150 rounded-2xl text-purple-700">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">تحليل ورفع المقايسة الذكي (PDF / صور)</h3>
                    <p className="text-[10px] font-bold text-slate-500">قم برفع ملف المقايسة المسعرة لاستخراج البنود وتوصيفها تلقائياً</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowAiUploader(false);
                    setExtractedItems([]);
                    setAnalysisError(null);
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {extractedItems.length === 0 ? (
                <div className="border border-dashed border-slate-300 rounded-[24px] p-8 bg-white text-center hover:border-purple-400 transition-all cursor-pointer relative">
                  <input 
                    type="file" 
                    accept=".pdf,image/*" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isAnalyzing}
                  />
                  <div className="flex flex-col items-center justify-center gap-3">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                        <div className="text-xs font-black text-slate-800">جاري قراءة وتحليل ملف المقايسة بالذكاء الاصطناعي...</div>
                        <p className="text-[10px] font-bold text-slate-400 max-w-md leading-relaxed">
                          يقوم مراجع التكاليف الذكي بقراءة مستند المقايسة واستخراج البنود وتحديد التوصيفات الفنية، وحدات القياس، الكميات والأسعار، وتنسيقها تلقائياً لك.
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-slate-400 animate-bounce" />
                        <span className="text-xs font-black text-slate-800">اسحب وأفلت مستند المقايسة PDF هنا، أو اضغط لتحديد الملف</span>
                        <span className="text-[10px] font-bold text-slate-400">يدعم مستندات الـ PDF وصور المقايسات الممسوحة ضوئياً</span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between text-xs bg-purple-50 text-purple-950 px-5 py-4 rounded-[20px] font-bold gap-4 border border-purple-100">
                    <span>تم استخراج ({extractedItems.length}) بنداً بنجاح! يرجى مراجعة البنود أدناه لإجراء أي تعديلات قبل الحفظ النهائي.</span>
                    <div className="flex gap-2 shrink-0 w-full md:w-auto">
                      <button 
                        onClick={userRole === 'viewer' ? () => alert('عذراً، لا تملك صلاحية اعتماد البنود') : handleSaveExtractedItems}
                        disabled={userRole === 'viewer'}
                        className="flex-1 md:flex-initial rounded-2xl px-5 py-3 font-black flex items-center justify-center gap-2 text-xs transition bg-purple-600 text-white hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        اعتماد البنود وإدخالها للمقايسة
                      </button>
                      <button 
                        onClick={() => setExtractedItems([])}
                        className="bg-white border border-slate-200 text-slate-700 rounded-2xl px-4 py-3 font-black hover:bg-slate-100 transition-all text-xs"
                      >
                        إعادة الرفع
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs max-h-[400px] overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                        <tr>
                          <th className="p-3 text-slate-500 font-black">الكود</th>
                          <th className="p-3 text-slate-500 font-black w-[40%]">بيان الأعمال التوصيفي</th>
                          <th className="p-3 text-center text-slate-500 font-black">الوحدة</th>
                          <th className="p-3 text-center text-slate-500 font-black">الكمية</th>
                          <th className="p-3 text-center text-slate-500 font-black">السعر</th>
                          <th className="p-3 text-center text-slate-500 font-black">المجموع</th>
                          <th className="p-3 text-center text-slate-500 font-black">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {extractedItems.map((item) => (
                          <tr key={item.id} className="hover:bg-purple-50/10 transition-colors">
                            <td className="p-3">
                              {editingExtractedId === item.id ? (
                                <input 
                                  value={item.code}
                                  onChange={(e) => handleUpdateExtracted(item.id, { code: e.target.value })}
                                  className="w-16 p-2 border border-slate-200 rounded-xl text-center font-bold text-xs"
                                />
                              ) : (
                                <span className="font-black text-purple-700">{item.code}</span>
                              )}
                            </td>
                            <td className="p-3">
                              {editingExtractedId === item.id ? (
                                <textarea 
                                  value={item.description}
                                  onChange={(e) => handleUpdateExtracted(item.id, { description: e.target.value })}
                                  className="w-full p-2 border border-slate-200 rounded-xl text-xs"
                                  rows={2}
                                />
                              ) : (
                                <div className="font-bold text-slate-800 leading-relaxed">{item.description}</div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {editingExtractedId === item.id ? (
                                <input 
                                  value={item.unit}
                                  onChange={(e) => handleUpdateExtracted(item.id, { unit: e.target.value })}
                                  className="w-12 p-2 border border-slate-200 rounded-xl text-center font-bold text-xs"
                                />
                              ) : (
                                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-black">{item.unit}</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {editingExtractedId === item.id ? (
                                <input 
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateExtracted(item.id, { quantity: Number(e.target.value) })}
                                  className="w-20 p-2 border border-slate-200 rounded-xl text-center font-bold text-xs"
                                />
                              ) : (
                                <span className="font-mono font-bold text-slate-800">{item.quantity.toLocaleString()}</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {editingExtractedId === item.id ? (
                                <input 
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => handleUpdateExtracted(item.id, { price: Number(e.target.value) })}
                                  className="w-20 p-2 border border-slate-200 rounded-xl text-center font-bold text-xs"
                                />
                              ) : (
                                <span className="font-mono font-bold text-emerald-600">{item.price.toLocaleString()}</span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono font-black text-slate-900">
                              {(item.quantity * item.price).toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {editingExtractedId === item.id ? (
                                  <button onClick={() => setEditingExtractedId(null)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button onClick={() => setEditingExtractedId(item.id)} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded">
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => setExtractedItems(extractedItems.filter(it => it.id !== item.id))}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {analysisError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs font-bold leading-relaxed flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-black mb-1">واجهت مراجع التكاليف الذكي مشكلة أثناء تحليل ملف المقايسة:</div>
                    <p>{analysisError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-slate-500 font-black">رقم البند</th>
                <th className="p-4 text-slate-500 min-w-[450px] w-[55%] font-black">بيان الأعمال والمواصفات الفنية المعتمدة</th>
                <th className="p-4 text-center text-slate-500 font-black">الوحدة</th>
                <th className="p-4 text-center text-slate-500 font-black">الكمية التعاقدية</th>
                <th className="p-4 text-center text-slate-500 font-black">سعر الفئة</th>
                <th className="p-4 text-center text-slate-500 font-black">إجمالي القيمة</th>
                <th className="p-4 text-center text-slate-500 font-black">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4 font-black text-purple-700">
                    {item.code}
                  </td>
                  <td className="p-4 min-w-[450px]">
                    <div className="font-bold text-slate-800 leading-relaxed">{item.description}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] text-slate-500 font-black">{item.unit}</span>
                  </td>
                  <td className="p-4 text-center font-mono font-bold text-slate-900">
                    {item.quantity.toLocaleString('en-US')}
                  </td>
                  <td className="p-4 text-center font-mono font-black text-emerald-600">
                    {item.price.toLocaleString('en-US')}
                  </td>
                  <td className="p-4 text-center font-mono font-black text-slate-900 bg-slate-50/30">
                    {(item.quantity * item.price).toLocaleString('en-US')}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => handleOpenEditModal(item)} 
                        disabled={userRole === 'viewer'}
                        className="p-2 rounded-xl text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="تعديل البند"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)} 
                        disabled={userRole === 'viewer'}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="حذف البند"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-20 text-center text-slate-300">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-12 h-12 mb-3 text-slate-200" />
                      <p className="text-xs font-black">المقايسة خالية تماماً للعملية المحددة</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">أضف بنوداً يدوياً أو استخدم مراجع التكاليف الذكي للتحليل والرفع</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📥 Unified Add/Edit Form Modal (Inspired strictly by image) */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-[24px] w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col md:flex-row">
            
            {/* Main Form Fields Panel (Left/Center) */}
            <div className="flex-1 p-8 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-slate-900">
                    {editingId ? 'تعديل بيانات بند المقايسة' : 'إضافة بند جديد للمقايسة المعتمدة'}
                  </h3>
                  <button 
                    onClick={() => setShowFormModal(false)} 
                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Fields Content */}
                <div className="space-y-6">
                  {/* Subsection 1: Basic Info */}
                  <div className="text-xs font-black text-purple-600 flex items-center gap-1.5">
                    <span className="inline-block w-1 h-4 bg-purple-600 rounded-xs"></span>
                    <span>البيانات والمواصفات التعاقدية</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Item Code */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-500 block mr-1">كود/رقم البند *</label>
                      <input 
                        type="text"
                        value={formState.code}
                        onChange={(e) => setFormState({...formState, code: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:bg-slate-50/30 transition-all placeholder-slate-400" 
                        placeholder="مثال: 1/1 أو ب-3"
                      />
                    </div>

                    {/* Description (Span-2) */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-black text-slate-500 block mr-1">بيان الأعمال والمواصفات الفنية المعتمدة *</label>
                      <input 
                        type="text"
                        value={formState.description}
                        onChange={(e) => setFormState({...formState, description: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:bg-slate-50/30 transition-all placeholder-slate-400" 
                        placeholder="مثال: توريد وصب خرسانة مسلحة لزوم القواعد والأساسات..."
                      />
                    </div>
                  </div>

                  {/* Subsection 2: Quantities, Units, and Pricing */}
                  <div className="text-xs font-black text-purple-600 flex items-center gap-1.5 mt-6">
                    <span className="inline-block w-1 h-4 bg-purple-600 rounded-xs"></span>
                    <span>الكميات والقياس والتسعير الفني</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Unit Selector */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-500 block mr-1">وحدة القياس التعاقدية *</label>
                      <select
                        value={formState.unit}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormState({...formState, unit: val});
                          if (val === 'custom') {
                            setIsCustomUnit(true);
                          } else {
                            setIsCustomUnit(false);
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:bg-slate-50/30 transition-all"
                      >
                        <option value="م٣">م٣ (متر مكعب)</option>
                        <option value="م٢">م٢ (متر مربع)</option>
                        <option value="م.ط">م.ط (متر طولي)</option>
                        <option value="عدد">عدد (وحدة)</option>
                        <option value="مقطوعية">مقطوعية (مقطوع)</option>
                        <option value="طن">طن (وزن)</option>
                        <option value="كجم">كجم (وزن خفيف)</option>
                        <option value="custom">أخرى (كتابة يدوية)</option>
                      </select>
                    </div>

                    {/* Custom Unit Field (visible only when 'custom' is selected) */}
                    {isCustomUnit ? (
                      <div className="space-y-1 animate-in slide-in-from-right duration-200">
                        <label className="text-[11px] font-black text-slate-500 block mr-1">اكتب الوحدة المخصصة *</label>
                        <input 
                          type="text"
                          value={customUnitText}
                          onChange={(e) => setCustomUnitText(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:bg-slate-50/30 transition-all placeholder-slate-400" 
                          placeholder="مثال: ساعة، لتر..."
                        />
                      </div>
                    ) : (
                      <div className="hidden sm:block"></div>
                    )}

                    {/* Contract Quantity */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-500 block mr-1">الكمية التعاقدية *</label>
                      <input 
                        type="number"
                        min={0}
                        value={formState.quantity || ''}
                        onChange={(e) => setFormState({...formState, quantity: Number(e.target.value)})}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:bg-slate-50/30 transition-all font-mono" 
                        placeholder="مثال: 450"
                      />
                    </div>

                    {/* Category Unit Price */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-500 block mr-1">سعر الفئة بالجنيه (ج.م) *</label>
                      <input 
                        type="number"
                        min={0}
                        value={formState.price || ''}
                        onChange={(e) => setFormState({...formState, price: Number(e.target.value)})}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:bg-slate-50/30 transition-all font-mono" 
                        placeholder="مثال: 6200"
                      />
                    </div>
                  </div>

                  {/* Calculated summary row */}
                  {formState.quantity > 0 && formState.price > 0 && (
                    <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl flex justify-between items-center text-xs font-black text-purple-950 animate-in zoom-in-95 duration-150">
                      <span>إجمالي القيمة التقديرية للبند:</span>
                      <span className="text-sm font-mono text-purple-700">{(formState.quantity * formState.price).toLocaleString()} ج.م</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={handleSaveItem}
                  className="flex-1 rounded-2xl py-3.5 text-xs font-black bg-purple-600 hover:bg-purple-700 text-white transition shadow-sm"
                >
                  اعتماد وحفظ البند بالمقايسة
                </button>
                <button 
                  onClick={() => setShowFormModal(false)} 
                  className="px-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl py-3.5 text-xs font-black transition"
                >
                  إلغاء التعديل
                </button>
              </div>
            </div>

            {/* Premium Informative Right Sidebar inside Modal */}
            <div className="w-full md:w-64 bg-slate-50 p-8 border-r border-slate-150 flex flex-col justify-between hidden md:flex">
              <div>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-purple-600 border border-slate-200 mb-6 shadow-xs">
                  <FileText className="w-6 h-6" />
                </div>
                
                <h4 className="text-base font-black text-slate-950">المقايسة التثمينية</h4>
                <p className="text-[11px] text-slate-500 font-bold mt-2 leading-relaxed">
                  نظام إدارة جدول الكميات وتوصيف فئات الأعمال الهندسية لضبط الفروقات وحصر الكميات بدقة.
                </p>
              </div>

              {/* Process Stages Tracking Block - Dynamically changes colors based on form progress */}
              <div className="space-y-3 pt-6 border-t border-slate-200">
                <div className={`flex items-center gap-2 text-xs font-black ${formState.code && formState.description ? 'text-emerald-600 font-bold' : 'text-purple-700'}`}>
                  <span>|</span>
                  <span>1. البيانات والوصف</span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-black ${formState.quantity > 0 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <span>|</span>
                  <span>2. وحدة القياس والكمية</span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-black ${formState.price > 0 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <span>|</span>
                  <span>3. الفئة والماليات</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Print BOQ Settings Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-purple-600 animate-pulse" />
                  خيارات طباعة المقايسة
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">خصص أبعاد واتجاه صفحة الطباعة للتصميم المعتمد</p>
              </div>
              <button 
                onClick={() => setShowPrintModal(false)} 
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Options */}
            <div className="p-6 space-y-5">
              {/* Paper Size Option */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-500 mr-1">مقاس الورقة (Paper Size)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPrintPaperSize('A4')}
                    className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                      printPaperSize === 'A4'
                        ? 'border-purple-600 bg-purple-50/40 text-purple-900 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
                    }`}
                  >
                    <span className="text-sm">A4 (افتراضي)</span>
                    <span className="text-[10px] opacity-60">مناسب للطباعة السريعة والملفات العادية</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintPaperSize('A3')}
                    className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                      printPaperSize === 'A3'
                        ? 'border-purple-600 bg-purple-50/40 text-purple-900 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
                    }`}
                  >
                    <span className="text-sm">A3 (لوحة عريضة)</span>
                    <span className="text-[10px] opacity-60">مثالي لجداول الأعمال الكثيرة واللوحات الفنية</span>
                  </button>
                </div>
              </div>

              {/* Page Orientation Option */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-500 mr-1">اتجاه الصفحة (Orientation)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPrintOrientation('portrait')}
                    className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      printOrientation === 'portrait'
                        ? 'border-purple-600 bg-purple-50/40 text-purple-900 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
                    }`}
                  >
                    <span className="text-sm">رأسي (Portrait)</span>
                    <span className="text-[10px] opacity-60">تخطيط عمودي تقليدي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintOrientation('landscape')}
                    className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      printOrientation === 'landscape'
                        ? 'border-purple-600 bg-purple-50/40 text-purple-900 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
                    }`}
                  >
                    <span className="text-sm">أفقي (Landscape)</span>
                    <span className="text-[10px] opacity-60">تخطيط عرضي للجداول الواسعة</span>
                  </button>
                </div>
              </div>

              {/* Summary message */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed font-bold">
                <p>سيتم تحويل المقايسة الحالية المكونة من <span className="text-purple-600 font-black">({activeBoqItems.length})</span> بنداً إلى ملف جاهز للطباعة مباشرة بمقاس <span className="text-purple-600 font-black">{printPaperSize}</span> بالاتجاه <span className="text-purple-600 font-black">{printOrientation === 'portrait' ? 'الرأسي' : 'الأفقي'}</span> شامل الترويسة والتفقيط والاعتمادات الرسمية.</p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => {
                  handlePrintBOQ(printPaperSize, printOrientation);
                  setShowPrintModal(false);
                }}
                className="flex-1 rounded-2xl bg-purple-600 text-white py-3.5 font-black shadow-lg shadow-purple-600/10 hover:bg-purple-700 hover:shadow-purple-600/20 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>إصدار للطباعة الآن</span>
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl py-3.5 font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
