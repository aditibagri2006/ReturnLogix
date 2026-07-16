import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

const COLORS = ["#7c3aed", "#22c55e", "#f59e0b", "#ef4444", "#6366f1", "#06b6d4", "#ec4899"];

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="chart-card-body">{children}</div>
    </div>
  );
}

function AnalyticsCharts({ data }) {
  if (!data) return null;

  const {
    status_distribution = [],
    category_distribution = [],
    carrier_distribution = [],
    segment_distribution = [],
    monthly_returns = [],
    refund_trend = [],
    ai_prediction_distribution = [],
    ai_sample_size = 0,
  } = data;

  return (
    <div className="chart-grid">
      <ChartCard title="Return Status Distribution">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={status_distribution} dataKey="value" nameKey="label" outerRadius={80} label>
              {status_distribution.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Returns by Category">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={category_distribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--purple-500)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Returns by Carrier">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={carrier_distribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--indigo-500)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly Returns" subtitle="Grouped by dispatch month">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthly_returns}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="var(--purple-600)" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Customer Segment Distribution">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={segment_distribution} dataKey="value" nameKey="label" outerRadius={80} label>
              {segment_distribution.map((_, i) => (
                <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Refund Amount Trend" subtitle="Total ₹ refunded, by dispatch month">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={refund_trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
            <Line type="monotone" dataKey="amount" stroke="var(--green-500)" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="AI Prediction Distribution"
        subtitle={`Based on the ${ai_sample_size} most recent returns`}
      >
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={ai_prediction_distribution} dataKey="value" nameKey="label" outerRadius={80} label>
              {ai_prediction_distribution.map((_, i) => (
                <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

export default AnalyticsCharts;
