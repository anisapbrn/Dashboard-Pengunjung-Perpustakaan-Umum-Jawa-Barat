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

// Format Tahun
function formatYears(y) {
    if (!y.length) return "";
    
    const s = y.map(Number).sort((a, b) => a - b);
  
    // Jika hanya 1 tahun
    if (s.length === 1) return `${s[0]}`;
  
    // Jika hanya 2 tahun → langsung pakai " & "
    if (s.length === 2) {
      return `${s[0]} & ${s[1]}`;
    }
  
    // Jika berurutan penuh → tampilkan rentang
    if (s[s.length - 1] - s[0] === s.length - 1) {
      return `${s[0]} - ${s[s.length - 1]}`;
    }
  
    // Jika data acak → koma + “&” sebelum terakhir
    return s.slice(0, -1).join(", ") + " & " + s[s.length - 1];
  }  

function formatCities(c, total) {
  if (c.length === total) return "Kabupaten/Kota di Jawa Barat";
  if (c.length === 1) return capitalizeRegion(c[0]);

  const formatted = c.map(r => capitalizeRegion(r));
  if (formatted.length === 2) return `${formatted[0]} dan ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(", ")}, dan ${formatted.slice(-1)}`;
}

// Fungsi judul dinamis
function setChartTitle() {
  const t = document.getElementById("chartTitle");
  
  // Ambil filter yang sedang aktif
  const years = [...document.querySelectorAll(".yearCheck:checked")].map(c => c.value);
  const cities = [...document.querySelectorAll(".cityCheck:checked")].map(c => c.value);
  const totalCities = new Set(rawData.map(r => r.nama_kabupaten_kota)).size;

  // 1. Jika tidak ada data, tampilkan pesan default
  if (!years.length || !cities.length) {
    t.innerText = "Silakan pilih Tahun dan Kabupaten/Kota untuk menampilkan grafik";
    return;
  }

  // 2. Siapkan teks dinamis untuk judul
  const cityText = formatCities(cities, totalCities);
  const yearText = formatYears(years); 

  // 3. Logika SWITCH untuk judul
  switch (currentChart) {
    case 'bar':
      t.innerText = `Data Pengunjung – ${cityText} (Tahun ${yearText})`;
      break;
    
    case 'line':
      t.innerText = `Tren Pengunjung – ${cityText} (Tahun ${yearText})`;
      break;
      
    case 'pie':
      t.innerText = `Proporsi Persentase Pengunjung – ${cityText} (Tahun ${yearText})`;
      break;
      
    default:
      t.innerText = "Dashboard Pengunjung";
  }
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

// Fungsi line cahrt
function lineChartData(data, years, cities) {
  // Sumbu X adalah tahun, diurutkan
  const labels = years.map(String).sort((a, b) => a - b);

  // Setiap dataset adalah 1 garis untuk 1 kota
  const datasets = cities.map((city, index) => {
    // Ambil data untuk setiap tahun (sesuai urutan labels)
    const dataPoints = labels.map(year => {
      const d = data.find(item => 
        item.nama_kabupaten_kota === city && String(item.tahun) === String(year)
      );
      return d ? d.jumlah_pemustaka : 0;
    });

    return {
      label: capitalizeRegion(city), 
      data: dataPoints,
      backgroundColor: pieColors[index % pieColors.length],
      borderColor: pieColors[index % pieColors.length],
      fill: false, 
      tension: 0.1 
    };
  });

  return { labels, datasets };
}

// Legend custom
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

// Render Charts
function renderCharts(data, years, cities) {
  // 1. Hancurkan chart lama
  barChart?.destroy();
  pieChart?.destroy();
  lineChart?.destroy();

  // 2. Data untuk BAR CHART
  const barData = groupedData(data, years, cities);
  barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: barData,
    options: {
      maintainAspectRatio: false,
      aspectRatio: window.innerWidth < 768 ? 1.2 : 2,
      scales: {
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 90,
            minRotation: 0,
            font: {
                size: window.innerWidth < 768 ? 7 : 11
            }
          }
        }
      }
    }
  });

  // 3. Data untuk PIE CHART
  const pieCanvas = document.getElementById("pieChart");
  let pieLabels, pieValues; // Deklarasikan variabel di luar

  if (cities.length === 1) {
    // --- LOGIKA: JIKA HANYA 1 KOTA DIPILIH ---
    // Slices/potongan akan menjadi TAHUN
    const selectedCity = cities[0];
    
    // Labels adalah tahun-tahun yang dipilih
    pieLabels = years.map(String).sort((a, b) => a - b);
    
    // Values adalah data untuk 1 kota itu, per tahun
    pieValues = pieLabels.map(year => {
      const d = data.find(item => 
        item.nama_kabupaten_kota === selectedCity && String(item.tahun) === String(year)
      );
      return d ? d.jumlah_pemustaka : 0;
    });

  } else {
    // --- LOGIKA: JIKA LEBIH DARI 1 KOTA DIPILIH ---
    // Slices/potongan adalah KOTA (Total)
    const isMultiYear = years.length > 1;
    pieLabels = cities.map(c =>
      isMultiYear ? `${capitalizeRegion(c)} (Total)` : capitalizeRegion(c)
    );
    pieValues = cities.map(city =>
      data
        .filter(d => d.nama_kabupaten_kota === city && years.includes(String(d.tahun)))
        .reduce((sum, d) => sum + d.jumlah_pemustaka, 0)
    );
  }

  // Buat Pie Chart dengan data (pieLabels/pieValues)
  pieChart = new Chart(pieCanvas, {
    type: "pie",
    data: {
      labels: pieLabels,
      datasets: [{
        data: pieValues,
        backgroundColor: pieColors.slice(0, pieLabels.length), 
        borderColor: "#fff",
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        
        // Tooltip persentase
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = (value / total * 100).toFixed(1); 
              return `${label}: ${value.toLocaleString()} (${percentage}%)`;
            }
          }
        }
      }
    }
  });

  // Render legend custom
  renderPieLegend(pieChart);

  // 4. Data untuk LINE CHART
  const lineData = lineChartData(data, years, cities); 
  lineChart = new Chart(document.getElementById("lineChart"), {
    type: "line",
    data: lineData,
    options: {
      maintainAspectRatio: false,
      aspectRatio: window.innerWidth < 768 ? 1.2 : 2
    }
  });

  // 5. Tampilkan chart yang aktif
  showChart(currentChart);
}

// Helpers
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

  setChartTitle();
  renderCharts(filtered, years, cities);

  updateDescription();
  updateInsight(currentChart, years, cities, filtered);
}

// Dropdown & Select All
function toggleAll(master, cls) {
  document.querySelectorAll(cls).forEach(c => c.checked = master.checked);
  applyFilters();
}

function syncMaster(master, list) {
  master.checked = [...list].every(i => i.checked);
}

// Fungsi deskripsi
function updateDescription() {
  const el = document.getElementById("chartDescription");
  if (!el) return;

  let description = "";

  switch (currentChart) {
    case 'bar':
      description = "Bar Chart (Grafik Batang) ini berfungsi untuk membandingkan total pengunjung antar wilayah dan/atau antar tahun. Grafik ini memudahkan untuk melihat wilayah mana yang memiliki pengunjung paling banyak/sedikit, atau bagaimana perbandingan jumlah pengunjung dari tahun ke tahun untuk satu atau beberapa wilayah.";
      break;
    case 'line':
      description = "Line Chart (Grafik Garis) ini berfungsi untuk menunjukkan tren atau pertumbuhan jumlah pengunjung dari waktu ke waktu. Setiap garis mewakili satu wilayah, sehingga Anda dapat melihat pola dan pergerakan data (naik, turun, atau stabil) selama periode yang dipilih.";
      break;
    case 'pie':
      description = "Pie Chart (Grafik Lingkaran) ini berfungsi untuk menunjukkan proporsi atau persentase kontribusi setiap wilayah/tahun terhadap total keseluruhan pengunjung. Ini ideal untuk melihat seberapa besar porsi suatu wilayah/tahun dibandingkan dengan wilayah/tahun lainnya.";
      break;
    default:
      description = "";
  }
  
  el.innerHTML = description;
}

// Fungsi Insight
function updateInsight(chartType, years, cities, filtered) {
  const note = document.getElementById("chartInsight");
  
  if (!years.length || !cities.length || !filtered.length) {
    note.innerHTML = "Silakan pilih tahun dan wilayah untuk melihat analisis data.";
    note.style.display = "none";
    return;
  }
  
  note.style.display = "block";

  const cityTotals = cities.map(city => {
    const total = filtered
      .filter(d => d.nama_kabupaten_kota === city)
      .reduce((sum, d) => sum + d.jumlah_pemustaka, 0);
    return { city, total };
  });
  
  const highestOverall = cityTotals.reduce((a, b) => (a.total > b.total ? a : b));
  const lowestOverall = cityTotals.reduce((a, b) => (a.total < b.total ? a : b));
  
  const formatCity = c => capitalizeRegion(c);
  let insight = "";
  let yearText = formatYears(years);

  // -----------------------------------------------------------------
  // [ START ] LOGIKA BAR CHART 
  // -----------------------------------------------------------------
  if (chartType === "bar") {

    // LOGIKA 1: Jika HANYA 1 KOTA dipilih
    if (cities.length === 1) {
        const totalSatuKota = cityTotals[0].total; 
        let totalInsight = `Total pengunjung <strong>${formatCity(cities[0])}</strong> 
                            pada periode <strong>${yearText}</strong> adalah ${totalSatuKota.toLocaleString()} pengunjung.`;
        let yearInsight = "";
        if (years.length > 1) {
            const sortedData = [...filtered].sort((a, b) => a.jumlah_pemustaka - b.jumlah_pemustaka);
            const lowest = sortedData[0];
            const highest = sortedData[sortedData.length - 1];
            yearInsight = `<br>Tahun pengunjung <strong>tertinggi</strong> adalah tahun <strong>${highest.tahun}</strong> (${highest.jumlah_pemustaka.toLocaleString()} pengunjung), 
                           sedangkan <strong>terendah</strong> adalah tahun <strong>${lowest.tahun}</strong> (${lowest.jumlah_pemustaka.toLocaleString()} pengunjung).`;
        }
        insight = totalInsight + yearInsight;
    } 
    
    // LOGIKA 2: Jika LEBIH DARI 1 KOTA dipilih
    else {
        // JIKA HANYA 1 TAHUN DIPILIH
        if (years.length === 1) {
            if (highestOverall.city === lowestOverall.city) {
                 insight = `Pada tahun <strong>${years[0]}</strong>, hanya <strong>${formatCity(highestOverall.city)}</strong> yang memiliki data 
                            (${highestOverall.total.toLocaleString()} pengunjung).`;
            } else {
                 insight = `Pada tahun <strong>${years[0]}</strong>, wilayah dengan pengunjung tertinggi adalah <strong>${formatCity(highestOverall.city)}</strong> 
                            (${highestOverall.total.toLocaleString()} pengunjung), 
                            sedangkan terendah adalah <strong>${formatCity(lowestOverall.city)}</strong> 
                            (${lowestOverall.total.toLocaleString()} pengunjung).`;
            }
        }
        // JIKA LEBIH DARI 1 TAHUN DIPILIH
        else {
            // Bagian 1: Insight Keseluruhan (Overall)
            let overallInsight = `Secara keseluruhan, wilayah dengan total pengunjung tertinggi adalah <strong>${formatCity(highestOverall.city)}</strong> 
                                  (${highestOverall.total.toLocaleString()} pengunjung), 
                                  sedangkan terendah adalah <strong>${formatCity(lowestOverall.city)}</strong> 
                                  (${lowestOverall.total.toLocaleString()} pengunjung).`;

            // Bagian 2: Insight Per Tahun
            let perYearInsight = "<br><br><strong>Analisis perbandingan per tahun:</strong><ul style='margin-top:10px; padding-left: 20px;'>";
            
            const sortedYears = [...years].sort();
            
            sortedYears.forEach(year => {
                const yearData = filtered.filter(d => String(d.tahun) === String(year));
                if (yearData.length === 0) return;

                const highest = yearData.reduce((a, b) => (a.jumlah_pemustaka > b.jumlah_pemustaka ? a : b));
                const lowest = yearData.reduce((a, b) => (a.jumlah_pemustaka < b.jumlah_pemustaka ? a : b));

                if (highest.nama_kabupaten_kota === lowest.nama_kabupaten_kota) {
                     perYearInsight += `<li>Tahun <strong>${year}</strong>: Hanya <strong>${formatCity(highest.nama_kabupaten_kota)}</strong> yang memiliki data (${highest.jumlah_pemustaka.toLocaleString()}).</li>`;
                } else {
                    perYearInsight += `<li>Tahun <strong>${year}</strong>: 
                                Tertinggi <strong>${formatCity(highest.nama_kabupaten_kota)}</strong> (${highest.jumlah_pemustaka.toLocaleString()}), 
                                Terendah <strong>${formatCity(lowest.nama_kabupaten_kota)}</strong> (${lowest.jumlah_pemustaka.toLocaleString()}).</li>`;
                }
            });
            perYearInsight += "</ul>";

            insight = overallInsight + perYearInsight;
        }
    }
  }
  // -----------------------------------------------------------------
  // [ END ] LOGIKA  BAR CHART
  // -----------------------------------------------------------------

  // -----------------------------------------------------------------
  // [ START ] LOGIKA LINE CHART
  // -----------------------------------------------------------------
  if (chartType === "line") {
    
    // LOGIKA 1: Jika HANYA 1 KOTA
    if (cities.length === 1) {
        insight = `Pada periode ${yearText}, data untuk <strong>${formatCity(cities[0])}</strong> menunjukkan `;
        const cityData = filtered.filter(d => d.nama_kabupaten_kota === cities[0]).sort((a,b) => a.tahun - b.tahun);
        if (cityData.length > 1) {
             const first = cityData[0];
             const last = cityData[cityData.length - 1];
             if (last.jumlah_pemustaka > first.jumlah_pemustaka) {
                insight += `adanya <strong>peningkatan</strong> pengunjung (dari ${first.jumlah_pemustaka.toLocaleString()} di ${first.tahun} menjadi ${last.jumlah_pemustaka.toLocaleString()} di ${last.tahun}).`;
             } else if (last.jumlah_pemustaka < first.jumlah_pemustaka) {
                 insight += `adanya <strong>penurunan</strong> pengunjung (dari ${first.jumlah_pemustaka.toLocaleString()} di ${first.tahun} menjadi ${last.jumlah_pemustaka.toLocaleString()} di ${last.tahun}).`;
             } else {
                 insight += `kondisi yang <strong>stabil</strong> (tetap ${first.jumlah_pemustaka.toLocaleString()} pengunjung).`;
             }
        } else {
            insight += `data hanya tersedia untuk satu titik waktu.`;
        }
    } 
    // LOGIKA 2: Jika LEBIH DARI 1 KOTA
    else {
        const sortedYears = [...years].sort();
        if (sortedYears.length < 2) {
            insight = `Grafik menampilkan perbandingan data. Wilayah dengan total pengunjung tertinggi (kumulatif) adalah <strong>${formatCity(highestOverall.city)}</strong> (${highestOverall.total.toLocaleString()}).`;
        } else {
            const firstYear = sortedYears[0];
            const lastYear = sortedYears[sortedYears.length - 1];
            let cityTrends = []; 
            cities.forEach(city => {
                const dataFirst = filtered.find(d => d.nama_kabupaten_kota === city && String(d.tahun) === String(firstYear));
                const dataLast = filtered.find(d => d.nama_kabupaten_kota === city && String(d.tahun) === String(lastYear));
                if (dataFirst && dataLast) {
                    const change = dataLast.jumlah_pemustaka - dataFirst.jumlah_pemustaka;
                    cityTrends.push({ city: city, change: change });
                }
            });

            if (cityTrends.length === 0) {
                insight = "Tidak cukup data pembanding (data di tahun awal dan akhir) untuk menganalisis tren pertumbuhan.";
            } else {
                const growing = cityTrends.filter(d => d.change > 0);
                const declining = cityTrends.filter(d => d.change < 0);
                const stable = cityTrends.filter(d => d.change === 0);
                
                // JIKA <= 10 KOTA (Sebutkan nama)
                if (cities.length <= 10) {
                    insight = `Selama periode <strong>${yearText}</strong>, dari ${cityTrends.length} wilayah yang dianalisis, tren pengunjung adalah sebagai berikut:
                               <ul style='margin-top:10px; padding-left: 20px;'>`;

                    const growingNames = growing.length > 0 ? growing.map(d => formatCity(d.city)).join(', ') : 'Tidak ada';
                    const decliningNames = declining.length > 0 ? declining.map(d => formatCity(d.city)).join(', ') : 'Tidak ada';
                    const stableNames = stable.length > 0 ? stable.map(d => formatCity(d.city)).join(', ') : 'Tidak ada';

                    insight += `<li><strong>Peningkatan:</strong> ${growingNames}</li>`;
                    insight += `<li><strong>Penurunan:</strong> ${decliningNames}</li>`;
                    insight += `<li><strong>Stabil:</strong> ${stableNames}</li>`;
                    insight += `</ul>`;
                } 
                // JIKA > 10 KOTA (Pakai ringkasan)
                else { 
                    insight = `Selama periode <strong>${yearText}</strong>, 
                               dari ${cityTrends.length} wilayah yang dianalisis:
                               <ul style='margin-top:10px; padding-left: 20px;'>
                                 <li><strong>${growing.length}</strong> wilayah mengalami tren peningkatan.</li>
                                 <li><strong>${declining.length}</strong> wilayah mengalami tren penurunan.</li>
                                 <li><strong>${stable.length}</strong> wilayah tetap stabil.</li>
                               </ul>`;
                }

                // Sorotan Tren
                growing.sort((a, b) => b.change - a.change); 
                declining.sort((a, b) => a.change - b.change);
                const mostGrowth = growing.length > 0 ? growing[0] : null;
                const mostDecline = declining.length > 0 ? declining[0] : null;
                
                if (mostGrowth || mostDecline) {
                    insight += "<strong>Sorotan Tren:</strong>";
                    if (mostGrowth) {
                        insight += `<br>Peningkatan paling signifikan terjadi di <strong>${formatCity(mostGrowth.city)}</strong> 
                                    (bertambah ${mostGrowth.change.toLocaleString()} pengunjung).`;
                    }
                    if (mostDecline) {
                        insight += `<br>Penurunan terbesar terjadi di <strong>${formatCity(mostDecline.city)}</strong> 
                                    (berkurang ${Math.abs(mostDecline.change).toLocaleString()} pengunjung).`;
                    }
                }
            }
        }
    }
  }

  // -----------------------------------------------------------------
  // [ END ] LOGIKA LINE CHART
  // -----------------------------------------------------------------

  // -----------------------------------------------------------------
  // [ START ] LOGIKA PIE CHART
  // -----------------------------------------------------------------
  if (chartType === "pie") {
    const totalVisitors = cityTotals.reduce((sum, d) => sum + d.total, 0);

    // LOGIKA 1: Jika HANYA 1 KOTA dipilih
    if (cities.length === 1) {
        
        if (filtered.length === 0) {
            insight = "Tidak ada data untuk wilayah ini.";
        } else if (filtered.length === 1) {
            insight = `Total pengunjung untuk <strong>${formatCity(cities[0])}</strong> adalah <strong>${totalVisitors.toLocaleString()}</strong> pengunjung. `;
        } else {
            const sortedData = [...filtered].sort((a, b) => a.jumlah_pemustaka - b.jumlah_pemustaka);
            const lowestYear = sortedData[0];
            const highestYear = sortedData[sortedData.length - 1];

            // Hitung persentase
            const highestPercent = (highestYear.jumlah_pemustaka / totalVisitors * 100).toFixed(1);
            const lowestPercent = (lowestYear.jumlah_pemustaka / totalVisitors * 100).toFixed(1);

            insight = `Total pengunjung untuk <strong>${formatCity(cities[0])}</strong> adalah <strong>${totalVisitors.toLocaleString()}</strong> pnegunjung. ` +
                      `Kontribusi terbesar berasal dari tahun <strong>${highestYear.tahun}</strong> (${highestYear.jumlah_pemustaka.toLocaleString()} pengunjung, ${highestPercent}%), ` +
                      `sedangkan terkecil berasal dari tahun <strong>${lowestYear.tahun}</strong> (${lowestYear.jumlah_pemustaka.toLocaleString()} pengunjung, ${lowestPercent}%).`;
        }
    } 
    // LOGIKA 2: Jika LEBIH DARI 1 KOTA dipilih
    else {
        // Hitung persentase
        const highestPercent = (highestOverall.total / totalVisitors * 100).toFixed(1);
        const lowestPercent = (lowestOverall.total / totalVisitors * 100).toFixed(1);

        if (highestOverall.city === lowestOverall.city) {
            insight = `Total pengunjung adalah <strong>${totalVisitors.toLocaleString()}</strong> pengunjung. ` +
                      `Seluruh kontribusi berasal dari <strong>${formatCity(highestOverall.city)}</strong> (${highestOverall.total.toLocaleString()} pengunjung, 100%).`;
        } else {
            insight = `Total pengunjung adalah <strong>${totalVisitors.toLocaleString()}</strong> pengunjung. ` +
                      `Bagian terbesar berasal dari <strong>${formatCity(highestOverall.city)}</strong> (${highestOverall.total.toLocaleString()} pengunjung, ${highestPercent}%), ` +
                      `sedangkan bagian terkecil berasal dari <strong>${formatCity(lowestOverall.city)}</strong> (${lowestOverall.total.toLocaleString()} pengunjung, ${lowestPercent}%).`;
        }
    }
  }
  // -----------------------------------------------------------------
  // [ END ] LOGIKA PIE CHART
  // -----------------------------------------------------------------

  note.innerHTML = `<strong>Insight:</strong> ${insight}`;
}

// INIT
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

  // Ambil semua container
  const pieContainer = document.getElementById("pieContainer");
  const barCanvas = document.getElementById("barChart");
  const lineCanvas = document.getElementById("lineChart");

  // Tampilkan/sembunyikan wrapper-nya
  barCanvas.style.display = type === "bar" ? "block" : "none";
  lineCanvas.style.display = type === "line" ? "block" : "none";
  pieContainer.style.display = type === "pie" ? "flex" : "none";

  setChartTitle();

  const years = [...document.querySelectorAll(".yearCheck:checked")].map(c => c.value);
  const cities = [...document.querySelectorAll(".cityCheck:checked")].map(c => c.value);
  const filtered = rawData.filter(d =>
    years.includes(String(d.tahun)) && cities.includes(d.nama_kabupaten_kota)
  );
  
  updateDescription();
  updateInsight(currentChart, years, cities, filtered);
}

