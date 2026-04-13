import Link from 'next/link';

const portals = [
  {
    title: 'CIS Online',
    description: 'Manage subcontractor verification and CIS returns.',
    href: 'https://www.gov.uk/guidance/construction-industry-scheme',
  },
  {
    title: 'PAYE for Employers',
    description: 'Run payroll and submit PAYE information to HMRC.',
    href: 'https://www.gov.uk/payroll',
  },
  {
    title: 'VAT Services',
    description: 'Submit VAT returns and manage Making Tax Digital obligations.',
    href: 'https://www.gov.uk/vat-returns',
  },
];

export default function ContractorHmrcPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">HMRC Hub</h1>
        <p className="text-blue-300 mt-1">Quick links to core HMRC services for contractors.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {portals.map((portal) => (
          <a
            key={portal.title}
            href={portal.href}
            target="_blank"
            rel="noreferrer"
            className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition"
          >
            <h2 className="text-white font-semibold">{portal.title}</h2>
            <p className="text-blue-300 text-sm mt-2">{portal.description}</p>
            <p className="text-blue-400 text-sm mt-4">Open HMRC portal →</p>
          </a>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-semibold">Need your VAT breakdown?</h3>
        <p className="text-blue-300 text-sm mt-1">
          Use the VAT report to review taxable sales totals and rolling turnover.
        </p>
        <Link href="/contractor/vat-report" className="inline-block text-blue-400 hover:text-blue-300 mt-3 text-sm">
          Open VAT report →
        </Link>
      </div>
    </div>
  );
}
