import React, { useMemo } from 'react';
import { 
  motion 
} from 'motion/react';
import { 
  Users, 
  Award, 
  TrendingUp, 
  ShieldCheck, 
  Briefcase, 
  BookOpen, 
  Heart, 
  Building2, 
  ArrowRightLeft,
  DollarSign,
  PieChart,
  Activity,
  CheckCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import { SiteWorker, WorkerAttendance, WorkerSalaryPayment, Contract } from '../types';

interface HrStrategyTabProps {
  workers: SiteWorker[];
  attendanceLogs: WorkerAttendance[];
  salaryPayments: WorkerSalaryPayment[];
  contracts?: Contract[];
  userRole?: string;
  addAuditLog?: (action: string, module: string, details: string) => void;
}

export default function HrStrategyTab({
  workers = [],
  attendanceLogs = [],
  salaryPayments = [],
  contracts = [],
  userRole,
  addAuditLog
}: HrStrategyTabProps) {

  // Live Statistics from Real Database
  const hrStats = useMemo(() => {
    const totalCount = workers.length;
    const appointed = workers.filter(w => w.type === 'appointed');
    const daily = workers.filter(w => w.type === 'laborer');
    const saraky = workers.filter(w => w.type === 'saraky');

    const totalAppointedBase = appointed.reduce((sum, w) => sum + w.baseRate, 0);
    const totalDailyRate = daily.reduce((sum, w) => sum + w.baseRate, 0);
    const totalSarakyRate = saraky.reduce((sum, w) => sum + w.baseRate, 0);

    // Job distribution
    const jobDistribution: Record<string, number> = {};
    workers.forEach(w => {
      const job = w.jobTitle || 'عامل عام';
      jobDistribution[job] = (jobDistribution[job] || 0) + 1;
    });

    return {
      totalCount,
      appointedCount: appointed.length,
      dailyCount: daily.length,
      sarakyCount: saraky.length,
      appointedPercent: totalCount > 0 ? Math.round((appointed.length / totalCount) * 100) : 0,
      dailyPercent: totalCount > 0 ? Math.round((daily.length / totalCount) * 100) : 0,
      sarakyPercent: totalCount > 0 ? Math.round((saraky.length / totalCount) * 100) : 0,
      appointedAvg: appointed.length > 0 ? Math.round(totalAppointedBase / appointed.length) : 0,
      dailyAvg: daily.length > 0 ? Math.round(totalDailyRate / daily.length) : 0,
      sarakyAvg: saraky.length > 0 ? Math.round(totalSarakyRate / saraky.length) : 0,
      jobDistribution
    };
  }, [workers]);

  return (
    <div className="space-y-8" dir="rtl">


      {/* Live Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black">إجمالي القوة العاملة</span>
            <span className="text-lg font-black text-slate-900 font-mono">{hrStats.totalCount} عامل وموظف</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black">المعينون (قوة فنية ورسمية)</span>
            <span className="text-lg font-black text-slate-900 font-mono">{hrStats.appointedCount} معين ({hrStats.appointedPercent}%)</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black">عمالة السراكي اليومية</span>
            <span className="text-lg font-black text-slate-900 font-mono">{hrStats.sarakyCount} سراكي ({hrStats.sarakyPercent}%)</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Activity size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-black">عمالة الأجر المباشر</span>
            <span className="text-lg font-black text-slate-900 font-mono">{hrStats.dailyCount} يومية ({hrStats.dailyPercent}%)</span>
          </div>
        </div>
      </div>

      {/* 6. الهيكل التنظيمي وإحصائيات القوى العاملة (Organizational Structure & Allocation) */}
      <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900">الهيكل التنظيمي وإحصائيات القوى العاملة المباشرة بالمشروع</h3>
            <p className="text-slate-500 text-xs font-bold mt-1">توزيع كفاءات القوى العاملة النشطة والمسجلة حالياً بقاعدة البيانات وعلاقتها بمعايير التقييم</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full">
            تحديث حي ومباشر
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-400 font-extrabold uppercase tracking-widest border-b border-slate-100">
                <th className="p-4">التصنيف والوظيفة</th>
                <th className="p-4">فئة التعاقد الحالية</th>
                <th className="p-4 text-center">العدد الفعلي النشط</th>
                <th className="p-4 text-center">متوسط الفئة المالية باليوم</th>
                <th className="p-4">آلية التوزيع بالموقع</th>
                <th className="p-4">مؤشر التقييم الرئيسي المقترح لها (Primary KPI)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
              {/* Generate dynamic rows based on actual jobTitle and count from DB */}
              {Object.entries(hrStats.jobDistribution).length > 0 ? (
                Object.entries(hrStats.jobDistribution).map(([job, count]) => {
                  // Figure out the sample worker for this job to show employment type and rates
                  const sampleWorker = workers.find(w => w.jobTitle === job || (!w.jobTitle && job === 'عامل عام'));
                  const sampleType = sampleWorker ? sampleWorker.type : 'laborer';
                  const sampleRate = sampleWorker ? sampleWorker.baseRate : 150;

                  let typeLabel = 'عمالة يومية';
                  let typeColor = 'text-emerald-600 bg-emerald-50';
                  if (sampleType === 'appointed') {
                    typeLabel = 'معين رسمي';
                    typeColor = 'text-indigo-600 bg-indigo-50';
                  } else if (sampleType === 'saraky') {
                    typeLabel = 'سراكي مؤقت';
                    typeColor = 'text-amber-600 bg-amber-50';
                  }

                  let allocationMethod = 'توزيع يومي حسب حزم المهام المفتوحة';
                  let kpi = 'معدل الحضور والالتزام بمعايير جودة الرصف';

                  if (job.includes('مهندس') || job.includes('مخطط')) {
                    allocationMethod = 'مسؤول عن قطاع جغرافي أو حزمة تسليم بالكامل';
                    kpi = 'نسبة إنجاز القطاع المحددة أسبوعياً وتجنب انحرافات الجدول';
                  } else if (job.includes('مشرف')) {
                    allocationMethod = 'إشراف ميداني وتوجيه مباشر لطواقم العمال';
                    kpi = 'صفر حوادث أمنية ونظافة قطاع التسليم وجودة التنفيذ';
                  } else if (job.includes('سائق') || job.includes('مشغل')) {
                    allocationMethod = 'تشغيل المعدات الإنشائية حسب برنامج العمل';
                    kpi = 'معدل استهلاك السولار وتجنب الأعطال المفاجئة للمعدة';
                  }

                  return (
                    <tr key={job} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                          <span className="text-slate-900 font-extrabold">{job}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-black ${typeColor}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="p-4 text-center text-slate-900 font-mono font-black">{count}</td>
                      <td className="p-4 text-center font-mono font-black text-indigo-600">{sampleRate} <span className="text-[10px] text-slate-400">ج</span></td>
                      <td className="p-4 text-slate-500 font-medium text-[11px]">{allocationMethod}</td>
                      <td className="p-4">
                        <span className="text-slate-800 bg-slate-100 px-2 py-1 rounded text-[10px] font-black">
                          {kpi}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    لا يوجد عاملين مسجلين بقاعدة البيانات لعرض هيكل توزيع القوى العاملة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. الاستقطاب والتوظيف الذكي & 3. إدارة الأداء والتطوير المستمر */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Briefcase size={18} className="text-indigo-600" />
            <span>الاستقطاب والتوظيف الذكي (Talent Acquisition)</span>
          </h2>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● منهجية التوظيف والاستقطاب المتطورة:</h3>
              <p>
                نعتمد على آليات توظيف متطورة وجاذبة للكفاءات الهندسية والتشغيلية المتميزة. نقوم بتصنيف احتياجات المشروعات زمنياً وميدانياً، وجلب مدراء المشاريع، ومهندسي المكتب الفني، والخبراء التقنيين، وعمال الميدان ذوي الخبرة الواسعة في البنية التحتية والشبكات.
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● الهوية المؤسسية الجاذبة (Employer Branding):</h3>
              <p>
                نلتزم ببناء هوية مهنية مرموقة تدفع أفضل الخبرات والمهندسين في السوق المصري والإقليمي للرغبة في الانضمام لطواقمنا الإنشائية، نظراً لتميز بيئة العمل وتقديم عروض مالية مستدامة وحوافز تقديرية فريدة.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● برنامج تهيئة وتأهيل الكوادر الجديدة (Onboarding):</h3>
              <p>
                يتلقى الموظف أو المهندس الجديد فور استلامه العمل برنامج تهيئة سريع وفعال لتعريفه بسياسات حوكمة المشاريع، وثقافة السلامة الميدانية، والربط البرمجي بين المهام والمستندات، لضمان اندماجه وإنتاجيته في أقصر فترة زمنية ممكنة.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <TrendingUp size={18} className="text-emerald-600" />
            <span>إدارة الأداء والتطوير المستمر (L&D and KPIs)</span>
          </h2>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● منظومة تقييم الأداء والـ KPIs:</h3>
              <p>
                يخضع جميع العاملين لمنظومة تقييم موضوعية تربط مخرجاتهم المهنية بأهداف المشروع الرئيسية. نستخدم مؤشرات كفاءة الأداء (KPIs) تضمن تتبع مدى الالتزام بالمخطط الزمني للأعمال، وخفض معدلات الهدر في الخامات، وتحقيق التميز الفني والعملي.
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● التدريب والتطوير المستمر بالمواقع:</h3>
              <p>
                تنسق إدارة التدريب برامج تطوير مستمرة للعمال والمهندسين تغطي أحدث آليات الرصف والتسويات، واستخدام تقنيات القياس الحجمي الحديثة، ودورات مكثفة للأمن والسلامة المهنية (HSE) للحد التام من مخاطر العمل.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● تخطيط التعاقب الوظيفي (Succession Planning):</h3>
              <p>
                نعمل على إعداد الكوادر الواعدة بالصف الثاني والثالث من مهندسي الموقع وتأهيلهم لتولي مناصب إشرافية وقيادية كبرى مستقبلاً، مما يضمن استمرارية الأعمال والمحافظة على الخبرات التاريخية داخل الهيكل التنظيمي للمؤسسة.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. علاقات الموظفين وبيئة العمل & 5. المزايا والتعويضات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck size={18} className="text-amber-600" />
            <span>علاقات الموظفين والامتثال القانوني (Compliance)</span>
          </h2>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● قوانين العمل والامتثال التام:</h3>
              <p>
                نلتزم بالامتثال الكامل لبنود قانون العمل المصري وقوانين التأمينات الاجتماعية واللوائح المنظمة للتشغيل المؤقت وعقود المقاولات. نضمن توثيق عقود جميع العاملين وشمولهم بالرعاية التأمينية والغطاء القانوني المناسب.
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● تكامل الأمن والسلامة والبيئة (HSE Coordination):</h3>
              <p>
                تتعاون إدارة الموارد البشرية بشكل يومي ولصيق مع مسؤولي الصحة والسلامة المهنية بالمواقع لضمان توفير بيئات تشغيلية خالية من الحوادث، وتزويد الطواقم بمهمات الوقاية الشخصية، وتطبيق قواعد التباعد والإسعافات الأولية الفورية.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● قنوات الاستماع المفتوحة وآليات الشكاوى:</h3>
              <p>
                نطبق سياسة الباب المفتوح، حيث تتوفر قنوات رقمية وميدانية تتيح لكافة العاملين والمهندسين رفع مقترحاتهم أو التظلم من أي إجراءات بكل سرية وموضوعية لضمان مناخ عمل صحي ومستقر وخالٍ من النزاعات.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Heart size={18} className="text-rose-600" />
            <span>المزايا والتعويضات والرعاية الشاملة (Rewards)</span>
          </h2>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● هيكل الأجور والمحفزات التشجيعية:</h3>
              <p>
                نقدم هياكل رواتب وبدلات شديدة التنافسية تلائم مستويات التضخم ومتطلبات المعيشة. تشمل الحزم بدلات اغتراب، وبدلات إقامة للمواقع النائية، ومكافآت إنجاز سريعة للمشروعات عند إنهاء حزم الأعمال المخططة قبل مددها التعاقدية.
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● منظومة الرعاية الطبية والاجتماعية:</h3>
              <p>
                تلتزم الشركة بتوفير غطاء رعاية صحية شامل لجميع الموظفين المعينين، بجانب تأمينات الحوادث الشخصية لعمال الميدان ومقاولات الباطن، مما يرسخ قيم الانتماء والأمان الوظيفي للمنتمين للمؤسسة.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-950 text-xs">● ربط الأداء بالامتيازات:</h3>
              <p>
                ترتبط المكافآت الدورية بمعدلات إنتاجية الأفراد والمجموعات، مع الاحتفاء اللحظي بنجوم المواقع المتميزين بالسلامة والسرعة والجودة وإدراج أسمائهم بلوحات شرف دورية مخصصة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
