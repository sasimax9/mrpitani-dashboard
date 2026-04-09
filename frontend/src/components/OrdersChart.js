import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function OrdersChart({ data }) {
  return (
    <div className="w-full h-80" data-testid="orders-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4EBE4" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#4B5E53"
            style={{ fontSize: '12px', fontFamily: 'IBM Plex Sans' }}
          />
          <YAxis
            stroke="#4B5E53"
            style={{ fontSize: '12px', fontFamily: 'IBM Plex Sans' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E4EBE4',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', fontFamily: 'IBM Plex Sans' }}
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="#2B593F"
            strokeWidth={2}
            dot={{ fill: '#2B593F', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="earnings"
            stroke="#A3E6B4"
            strokeWidth={2}
            dot={{ fill: '#A3E6B4', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}