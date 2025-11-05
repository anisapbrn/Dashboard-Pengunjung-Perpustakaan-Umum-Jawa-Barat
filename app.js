let rawData = [];
let currentChart = "bar";
let barChart, pieChart, lineChart;

const pieColors = [
  "#FFD700", "#FF69B4", "#6495ED", "#90EE90", "#FFA07A",
  "#FFB300", "#FF4081", "#4A86E8", "#66C266", "#FF7F50",
  "#FFC107", "#FF5C8A", "#5DA9E9", "#6FD96F", "#FF8E53",
  "#FFCD38", "#FF7FBF", "#72A8FF", "#7DDE79", "#FF9A5B",
  "#E6B800", "#FF4F9A", "#3E8EFF", "#4BC467", "#FF6E4A",
  "#FFD64C", "#FF92C5"
];

// ✅ Format Tahun diperbaiki
function formatYears(y) {
    if (!y.length) return "";
    
    const s = y.map(Number).sort((a, b) => a - b);
  
    // ✅ Jika hanya 1 tahun
    if (s.length === 1) return `${s[0]}`;
  
    // ✅ Jika hanya 2 tahun → langsung pakai " & "
    if (s.length === 2) {
      return `${s[0]} & ${s[1]}`;
    }
  
    // ✅ Jika berurutan penuh → tampilkan rentang
    if (s[s.length - 1] - s[0] === s.length - 1) {
      return `${s[0]} - ${s[s.length - 1]}`;
    }
  
    // ✅ Jika data acak → koma + “&” sebelum terakhir
    return s.slice(0, -1).join(", ") + " & " + s[s.length - 1];
  }  

function formatCities(c, total) {
  if (c.length === total) return "Kabupaten/Kota di Jawa Barat";
  if (c.length === 1) return capitalizeRegion(c[0]);

  const formatted = c.map(r => capitalizeRegion(r));
  if (formatted.length === 2) return `${formatted[0]} dan ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(", ")}, dan ${formatted.slice(-1)}`;
}

function updateTitle(years, cities, totalCities) {
  const t = document.getElementById("chartTitle");
  if (!years.length || !cities.length) {
    t.innerText = "Silakan pilih Tahun dan Kabupaten/Kota untuk menampilkan grafik";
    return;
  }
  t.innerText = `Rata-rata Pengunjung Perpustakaan per Hari – ${formatCities(cities, totalCities)} (Tahun ${formatYears(years)})`;
}

function groupedData(data, years, cities) {
  const labels = cities;
  const colors = ["#FFD700", "#FF69B4", "#6495ED", "#90EE90", "#FFA07A"];

  const datasets = years.map((y, i) => ({
    label: y,
    backgroundColor: colors[i % colors.length],
    borderColor: colors[i % colors.length],
    data: labels.map(c => {
      const d = data.find(x => x.nama_kabupaten_kota === c && String(x.tahun) === String(y));
      return d ? d.jumlah_pemustaka : 0;
    })
  }));

  return { labels, datasets };
}

/* ✅ Custom Legend */
function renderPieLegend(chart) {
  const legendContainer = document.getElementById("pieLegend");
  legendContainer.innerHTML = "";
  
  chart.data.labels.forEach((label, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="legend-color" style="background:${chart.data.datasets[0].backgroundColor[i]}"></span>
      ${label}
    `;
    legendContainer.appendChild(li);
  });
}

/* ✅ Render Charts */
function renderCharts(data, years, cities) {
  const chartData = groupedData(data, years, cities);

  barChart?.destroy();
  pieChart?.destroy();
  lineChart?.destroy();

  // BAR
  barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: chartData
  });

  const pieCanvas = document.getElementById("pieChart");

  // PIE
const isMultiYear = years.length > 1;

const pieLabels = cities.map(c =>
  isMultiYear ? `${capitalizeRegion(c)} (Total)` : capitalizeRegion(c)
);

const pieValues = cities.map(city =>
  data
    .filter(d => d.nama_kabupaten_kota === city && years.includes(String(d.tahun)))
    .reduce((sum, d) => sum + d.jumlah_pemustaka, 0)
);

pieChart = new Chart(pieCanvas, {
  type: "pie",
  data: {
    labels: pieLabels,
    datasets: [{
      data: pieValues,
      backgroundColor: pieColors.slice(0, cities.length),
      borderColor: "#fff",
      borderWidth: 2
    }]
  },
  options: {
    plugins: {
      legend: { display: false }
    }
  }
});

renderPieLegend(pieChart);

  // LINE
  lineChart = new Chart(document.getElementById("lineChart"), {
    type: "line",
    data: chartData
  });

  showChart(currentChart);
}

/* Helpers */
function capitalizeRegion(name) {
  let cleaned = name.toLowerCase()
    .replace(/kabupaten\s*/gi, "")
    .replace(/kota\s*/gi, "")
    .trim();

  if (!cleaned) return name;
  if (name.toLowerCase().includes("kabupaten")) return "Kabupaten " + capitalizeEach(cleaned);
  if (name.toLowerCase().includes("kota")) return "Kota " + capitalizeEach(cleaned);
  return capitalizeEach(cleaned);
}

function capitalizeEach(str) {
  return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function applyFilters() {
  const years = [...document.querySelectorAll(".yearCheck:checked")].map(c => c.value);
  const cities = [...document.querySelectorAll(".cityCheck:checked")].map(c => c.value);

  if (!years.length || !cities.length) {
    document.getElementById("chartTitle").innerText =
      "Silakan pilih Tahun dan Kabupaten/Kota untuk menampilkan grafik";
    barChart?.destroy(); pieChart?.destroy(); lineChart?.destroy();
    return;
  }

  const filtered = rawData.filter(d =>
    years.includes(String(d.tahun)) && cities.includes(d.nama_kabupaten_kota)
  );

  updateTitle(years, cities, new Set(rawData.map(r => r.nama_kabupaten_kota)).size);
  renderCharts(filtered, years, cities);
}

/* Dropdown & Select All */
function toggleAll(master, cls) {
  document.querySelectorAll(cls).forEach(c => c.checked = master.checked);
  applyFilters();
}

function syncMaster(master, list) {
  master.checked = [...list].every(i => i.checked);
}

function updateInsight(chartType, years, cities, filtered) {
    const note = document.getElementById("chartNote");
    if (!years.length || !cities.length || !filtered.length) {
      note.innerText = "Silakan pilih filter tahun dan wilayah untuk melihat analisis data.";
      return;
    }
  
    const cityTotals = cities.map(city => {
      const total = filtered
        .filter(d => d.nama_kabupaten_kota === city)
        .reduce((sum, d) => sum + d.jumlah_pemustaka, 0);
      return { city, total };
    });
  
    const highest = cityTotals.reduce((a, b) => (a.total > b.total ? a : b));
    const lowest = cityTotals.reduce((a, b) => (a.total < b.total ? a : b));
  
    const formatCity = c => capitalizeRegion(c);
  
    let insight = "";
    let yearText = formatYears(years);
  
    if (chartType === "bar") {
      insight =
        `Grafik bar membandingkan jumlah pengunjung. ` +
        `Wilayah dengan pengunjung tertinggi adalah **${formatCity(highest.city)}** ` +
        `(${highest.total.toLocaleString()} pengunjung${years.length > 1 ? " total" : ""}), ` +
        `sedangkan terendah adalah **${formatCity(lowest.city)}** ` +
        `(${lowest.total.toLocaleString()}).`;
    }
  
    if (chartType === "line") {
      insight = `Grafik garis memperlihatkan tren pengunjung pada ${yearText}. `;
  
      if (years.length > 1) {
        const sorted = filtered.sort((a, b) => a.tahun - b.tahun);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
  
        if (last.jumlah_pemustaka > first.jumlah_pemustaka) {
          insight += `Secara umum terjadi **peningkatan** minat pemustaka.`;
        } else if (last.jumlah_pemustaka < first.jumlah_pemustaka) {
          insight += `Secara umum terjadi **penurunan** jumlah pengunjung.`;
        } else {
          insight += `Perkembangan cenderung **stabil**.`;
        }
      } else {
        insight += `Data hanya menunjukkan kondisi pada tahun tersebut.`;
      }
    }
  
    if (chartType === "pie") {
      const totalVisitors = cityTotals.reduce((sum, d) => sum + d.total, 0);
  
      insight =
        `Grafik pie menunjukkan kontribusi tiap wilayah. ` +
        `Total pengunjung adalah **${totalVisitors.toLocaleString()}**. ` +
        `Bagian terbesar berasal dari **${formatCity(highest.city)}** ` +
        `(${highest.total.toLocaleString()}).`;
    }
  
    note.innerHTML = insight;
  }  

/* INIT */
fetch("data.json").then(r => r.json()).then(data => {
  rawData = data;
  const years = [...new Set(data.map(d => d.tahun))];
  const cities = [...new Set(data.map(d => d.nama_kabupaten_kota))];

  years.forEach(y =>
    dropdownYears.innerHTML += `<label><input type="checkbox" class="yearCheck" value="${y}" checked> ${y}</label>`
  );
  cities.forEach(c =>
    dropdownCities.innerHTML += `<label><input type="checkbox" class="cityCheck" value="${c}" checked> ${c}</label>`
  );

  checkAllYears.onchange = () => toggleAll(checkAllYears, ".yearCheck");
  checkAllCities.onchange = () => toggleAll(checkAllCities, ".cityCheck");

  document.addEventListener("change", e => {
    if (e.target.classList.contains("yearCheck")) syncMaster(checkAllYears, document.querySelectorAll(".yearCheck"));
    if (e.target.classList.contains("cityCheck")) syncMaster(checkAllCities, document.querySelectorAll(".cityCheck"));
    applyFilters();
  });

  btnYears.onclick = () => dropdownYears.classList.toggle("show");
  btnCities.onclick = () => dropdownCities.classList.toggle("show");
  document.addEventListener("click", e => {
    if (!e.target.closest(".dropdown-select"))
      document.querySelectorAll(".dropdown-content").forEach(d => d.classList.remove("show"));
  });

  applyFilters();
});

chartSelector.onchange = e => showChart(e.target.value);

function showChart(type) {
  currentChart = type;
  document.getElementById("barChart").style.display = type === "bar" ? "block" : "none";
  document.getElementById("lineChart").style.display = type === "line" ? "block" : "none";
  document.getElementById("pieContainer").style.display = type === "pie" ? "flex" : "none";
}
