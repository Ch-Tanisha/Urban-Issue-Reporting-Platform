import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title
} from 'chart.js'
import { Doughnut, Bar, Line } from 'react-chartjs-2'
import StatCard from '../../components/StatCard'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title)

const OPTS = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } }

export default function AdminAnalytics({ issues }) {
  const total    = issues.length
  const reported = issues.filter(i=>i.status==='Reported').length
  const inProg   = issues.filter(i=>i.status==='In Progress').length
  const resolved = issues.filter(i=>i.status==='Resolved').length

  // By block
  const blockMap = {}
  issues.forEach(i=>{ blockMap[i.block]=(blockMap[i.block]||0)+1 })

  // By category
  const catMap = {}
  issues.forEach(i=>{ catMap[i.category]=(catMap[i.category]||0)+1 })

  // By priority
  const priMap = { High:0, Medium:0, Low:0 }
  issues.forEach(i=>{ if(priMap[i.priority]!==undefined) priMap[i.priority]++ })

  // Monthly trend (mock spread of dates)
  const months = ['Sep','Oct','Nov','Dec','Jan','Feb']
  const monthlyReported = [12,18,25,20,30,issues.length]
  const monthlyResolved = [8, 14,20,16,24,resolved]

  const statusDonut = {
    labels:['Reported','In Progress','Resolved'],
    datasets:[{ data:[reported,inProg,resolved], backgroundColor:['#ef4444','#3b82f6','#10b981'], borderWidth:0 }]
  }
  const blockBar = {
    labels: Object.keys(blockMap),
    datasets:[{ label:'Issues', data:Object.values(blockMap), backgroundColor:['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444'], borderRadius:8 }]
  }
  const catBar = {
    labels: Object.keys(catMap),
    datasets:[{ label:'Issues', data:Object.values(catMap), backgroundColor:'#3b82f6', borderRadius:6 }]
  }
  const trendLine = {
    labels: months,
    datasets:[
      { label:'Reported', data:monthlyReported, borderColor:'#ef4444', backgroundColor:'rgba(239,68,68,0.08)', fill:true, tension:0.4 },
      { label:'Resolved', data:monthlyResolved, borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.08)', fill:true, tension:0.4 },
    ]
  }
  const priDoughnut = {
    labels:['High','Medium','Low'],
    datasets:[{ data:[priMap.High,priMap.Medium,priMap.Low], backgroundColor:['#ef4444','#f59e0b','#10b981'], borderWidth:0 }]
  }

  return (
    <div>
      <div className="page-section-header">
        <p className="eyebrow">Analytics</p>
        <h2>Platform-Wide Analytics</h2>
        <p>Comprehensive statistics across all blocks, categories, and statuses.</p>
      </div>

      {/* KPI Row */}
      <div className="stats-grid" style={{ marginBottom:24 }}>
        <StatCard label="Total Issues"    value={total}    color="slate"  icon="📊" />
        <StatCard label="Reported"        value={reported} color="red"    icon="🔴" />
        <StatCard label="In Progress"     value={inProg}   color="blue"   icon="⏳" />
        <StatCard label="Resolved"        value={resolved} color="green"  icon="✅" />
      </div>

      {/* Charts Row 1 */}
      <div className="admin-charts-row" style={{ marginBottom:24 }}>
        <div className="panel">
          <div className="panel-header"><h3>Issues by Status</h3></div>
          <div className="panel-body" style={{ height:240 }}>
            <Doughnut data={statusDonut} options={{ ...OPTS, cutout:'60%' }} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><h3>Issues by Priority</h3></div>
          <div className="panel-body" style={{ height:240 }}>
            <Doughnut data={priDoughnut} options={{ ...OPTS, cutout:'60%' }} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><h3>Issues by Block</h3></div>
          <div className="panel-body" style={{ height:240 }}>
            <Bar data={blockBar} options={{ ...OPTS, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1 } } } }} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:20 }}>
        <div className="panel">
          <div className="panel-header"><h3>Monthly Trend (Reported vs Resolved)</h3></div>
          <div className="panel-body" style={{ height:260 }}>
            <Line data={trendLine} options={{ ...OPTS, scales:{ y:{ beginAtZero:true } } }} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><h3>Issues by Category</h3></div>
          <div className="panel-body" style={{ height:260 }}>
            <Bar data={catBar} options={{ ...OPTS, plugins:{ legend:{ display:false } }, indexAxis:'y', scales:{ x:{ beginAtZero:true, ticks:{ stepSize:1 } } } }} />
          </div>
        </div>
      </div>
    </div>
  )
}
