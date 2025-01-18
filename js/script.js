// Sebagai Javascriptnya

//Import Dataset NYC Property Sales
async function fetchData() {
  const response = await fetch("../json/DatasetNycPropertySales.json");
  const data = await response.json();
  return data;
}
fetchData();

// Define constants for boroughs
const BOROUGH = {
  MANHATTAN: 1,
  BRONX: 2,
  BROOKLYN: 3,
  QUEENS: 4,
  STATEN_ISLAND: 5,
};

// Display names for BOROUGH
const BOROUGH_DISPLAY_NAME = {
  [BOROUGH.MANHATTAN]: "Manhattan",
  [BOROUGH.BRONX]: "Bronx",
  [BOROUGH.BROOKLYN]: "Brooklyn",
  [BOROUGH.QUEENS]: "Queens",
  [BOROUGH.STATEN_ISLAND]: "Staten Island",
};

// Month names for labeling
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Currency formatter
const formatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
  maximumFractionDigits: 0,
});

// Variables for chart and filter elements
let totalMonthlySaleChart = null;
let topCategoriesChart = null;
let bottomCategoriesChart = null;
let HighestCategoriesChart = null;
let totalUnitCategoriesChart = null;
let tableDataset = null;

// Filter variables
let selectedBoroughFilter = -1;
let selectedStartDate = "2016-09-01";
let selectedEndDate = "2017-08-31";

// Function to create sales table
function createSalesTable(data) {
  return new DataTable("#salesTable", {
    destroy: true,
    data: data,
    columns: [
      { data: "NAME BOROUGH" },
      { data: "NEIGHBORHOOD" },
      { data: "BUILDING CLASS CATEGORY" },
      { data: "TAX CLASS AT PRESENT" },
      { data: "TOTAL UNITS" },
      { data: "LAND SQUARE FEET" },
      { data: "GROSS SQUARE FEET" },
      { data: "YEAR BUILT" },
      //Sale Price
      {
        data: "SALE PRICE",
        render: (data, type) => {
          const number = DataTable.render
            .number(",", ".", 3, "$")
            .display(data);

          if (type === "display") {
            return number;
          }
          return data;
        },
      },
      { data: "SALE DATE" },
    ],
  });
}

// Main function to initialize the application
async function main() {
  const data = await fetchData();
  // Create sales table with imported data
  createSalesTable(data);

  // Apply filter and render charts
  const filter = createFilter(
    data,
    selectedBoroughFilter,
    selectedStartDate,
    selectedEndDate
  );

  render(filter);

  // Handle borough filter change
  const filterBorough = document.getElementById("borough-filter");
  filterBorough.addEventListener("change", (e) => {
    selectedBoroughFilter = Number(e.target.value);

    // Re-render the chart according to the filter
    const filter = createFilter(
      data,
      Number(e.target.value),
      selectedStartDate,
      selectedEndDate
    );

    render(filter);
  });

  // Populate borough filter options
  Object.keys(BOROUGH).forEach((key) => {
    const option = document.createElement("option");
    option.setAttribute("value", BOROUGH[key]);
    option.textContent = BOROUGH_DISPLAY_NAME[BOROUGH[key]];
    filterBorough.appendChild(option);
  });

  // Handle date filter changes
  const filterStartDate = document.getElementById("startDate");
  const filterEndDate = document.getElementById("endDate");

  filterStartDate.setAttribute("value", selectedStartDate);
  filterEndDate.setAttribute("value", selectedEndDate);

  filterStartDate.addEventListener("change", (e) => {
    const startDate = e.target.value;
    selectedStartDate = startDate;
    filterEndDate.setAttribute("min", startDate);

    const filter = createFilter(
      data,
      selectedBoroughFilter,
      startDate,
      selectedEndDate
    );

    render(filter);
  });

  filterEndDate.addEventListener("change", (e) => {
    const endDate = e.target.value;
    selectedEndDate = endDate;
    filterStartDate.setAttribute("max", endDate);

    const filter = createFilter(
      data,
      selectedBoroughFilter,
      selectedStartDate,
      endDate
    );

    render(filter);
  });
}

main();
// =========== End of Filter Date ============

// Sum function to calculate totals
function sum(data, key) {
  return data.reduce((total, item) => {
    let salePrice = item[key];

    if (typeof salePrice === "string") {
      salePrice = Number(item[key].split(".").join(""));
    }

    return total + salePrice;
  }, 0);
}

// Function to create filter
function createFilter(data, selectedBorough = -1, startDate, endDate) {
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  // Generate labels for each month between startDate and endDate
  const x = d3.scaleUtc().domain([startDateObj, endDateObj]);
  const labels = x.ticks(d3.utcMonth.every(1));

  // Map and filter the dataset
  const mappedData = data
    .map((item) => {
      const [date, month, year] = item["SALE DATE"].split("/").map(Number);
      return {
        ...item,
        date: new Date(year, month - 1, date),
        dateValue: {
          date: date,
          month: month - 1,
          year: year,
        },
      };
    })
    .filter((item) => {
      return startDateObj <= item.date && item.date <= endDateObj;
    })
    .filter(
      (item) => selectedBorough === -1 || item.BOROUGH == selectedBorough
    );

  // Get total monthly sales
  function getTotalMonthlySales() {
    const datasets = Object.keys(BOROUGH).map((key) => {
      const data = labels.map((date) => {
        const month = date.getMonth();
        const year = date.getFullYear();

        const filteredData = mappedData.filter((item) => {
          return (
            item.dateValue.month === month &&
            item.dateValue.year === year &&
            item.BOROUGH === BOROUGH[key]
          );
        });

        const totalSales = sum(filteredData, "SALE PRICE");

        return totalSales;
      });

      return {
        label: BOROUGH_DISPLAY_NAME[BOROUGH[key]],
        data: data,
      };
    });

    return {
      labels: labels.map(
        (date) => `${monthNames[date.getMonth()]} ${date.getFullYear()}`
      ),
      datasets: datasets.filter(
        (item) =>
          selectedBorough === -1 ||
          item.label === BOROUGH_DISPLAY_NAME[selectedBorough]
      ),
    };
  }
  // Get total sales
  function getTotalSales() {
    return formatter.format(sum(mappedData, "SALE PRICE"));
  }

  // Get total units
  function getTotalUnits() {
    return sum(mappedData, "TOTAL UNITS")
      .toFixed(0)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Get average sales
  function getAverageSales() {
    let totalSales = sum(mappedData, "SALE PRICE");
    let average = mappedData.length ? totalSales / mappedData.length : 0;
    return average;
  }

  // Get top categories by sales
  function getTopCategories() {
    const categorySales = {};
    mappedData.forEach((item) => {
      const category = item["BUILDING CLASS CATEGORY"];
      const salePrice = parseFloat(item["SALE PRICE"]);
      if (!isNaN(salePrice)) {
        if (category in categorySales) {
          categorySales[category] += salePrice;
        } else {
          categorySales[category] = salePrice;
        }
      }
    });

    const sortedCategories = Object.keys(categorySales).sort(
      (a, b) => categorySales[b] - categorySales[a]
    );

    const topCategories = sortedCategories.slice(0, 5);

    const topCategoriesList = topCategories.map((category) => {
      return {
        category: category,
        totalSales: categorySales[category],
      };
    });

    return topCategoriesList;
  }
  function getFilteredData() {
    return mappedData;
  }

  // Get bottom categories by sales
  function getBottomCategories() {
    const categorySales = {};
    mappedData.forEach((item) => {
      const category = item["BUILDING CLASS CATEGORY"];
      const salePrice = parseFloat(item["SALE PRICE"]);
      if (!isNaN(salePrice)) {
        if (category in categorySales) {
          categorySales[category] += salePrice;
        } else {
          categorySales[category] = salePrice;
        }
      }
    });

    const sortedCategories = Object.keys(categorySales).sort(
      (a, b) => categorySales[a] - categorySales[b]
    );

    const bottomCategories = sortedCategories.slice(0, 5);

    const bottomCategoriesList = bottomCategories.map((category) => {
      return {
        category: category,
        totalSales: categorySales[category],
      };
    });

    return bottomCategoriesList;
  }

  // Get top categories by units
  function getTopCategoriesByUnits() {
    const categoryUnits = {};
    mappedData.forEach((item) => {
      const category = item["BUILDING CLASS CATEGORY"];
      const totalUnits = parseFloat(item["TOTAL UNITS"]);
      if (!isNaN(totalUnits)) {
        if (category in categoryUnits) {
          categoryUnits[category] += totalUnits;
        } else {
          categoryUnits[category] = totalUnits;
        }
      }
    });

    const sortedCategories = Object.keys(categoryUnits).sort(
      (a, b) => categoryUnits[b] - categoryUnits[a]
    );

    const topCategories = sortedCategories.slice(0, 5);

    const topCategoriesList = topCategories.map((category) => {
      return {
        category: category,
        totalUnits: categoryUnits[category],
      };
    });

    return topCategoriesList;
  }

  return {
    getTotalMonthlySales,
    getTotalSales,
    getTotalUnits,
    getAverageSales,
    getTopCategories,
    getBottomCategories,
    getTopCategoriesByUnits,
    getFilteredData,
  };
}

function renderTotalSales(sales) {
  const totalSales = document.getElementById("totalSales");
  totalSales.textContent = sales;
}

function renderCharts(labels, datasets) {
  const ctx = document.getElementById("totalMontlySales");

  return new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor: [
          "#06285C",
          "#103D83",
          "#71CA66",
          "#FF9170",
          "#FEB152",
        ][index % 5],
        borderColor: ["#FF6384", "#FFA726", "#FFCE56", "#4BC0C0", "#36A2EB"][
          index % 5
        ],
      })),
    },
    options: {
      responsive: true,
      maintainAspectRation: false,
      interaction: {
        mode: "index",
      },
    },
  });
}

function renderTopCategoriesHorizontalBarChart(topCategories) {
  const labels = topCategories.map((item) => item.category);
  const data = topCategories.map((item) => item.totalSales);

  const ctx = document
    .getElementById("topCategoriesHorizontalBarChart")
    .getContext("2d");

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Total Sales",
          data: data,
          backgroundColor: [
            "#06285C",
            "#103D83",
            "#71CA66",
            "#FF9170",
            "#FEB152",
          ],
          borderColor: ["#FF6384", "#FFA726", "#FFCE56", "#4BC0C0", "#36A2EB"],

          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRation: false,
      indexAxis: "y",
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "$" + value.toLocaleString();
            },
          },
        },
      },
      plugins: {},
    },
  });
}
function renderBottomCategoriesHorizontalBarChart(bottomCategories) {
  const labels = bottomCategories.map((item) => item.category);
  const data = bottomCategories.map((item) => item.totalSales);

  const ctx = document
    .getElementById("bottomCategoriesHorizontalBarChart")
    .getContext("2d");

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Total Sales",
          data: data,
          backgroundColor: [
            "#06285C",
            "#103D83",
            "#71CA66",
            "#FF9170",
            "#FEB152",
          ],
          borderColor: ["#FF6384", "#FFA726", "#FFCE56", "#4BC0C0", "#36A2EB"],

          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRation: false,
      indexAxis: "y",
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "$" + value.toLocaleString();
            },
          },
        },
      },
      plugins: {},
    },
  });
}
function renderTopCategoriesDoughnutChartByUnits(topCategories) {
  const labels = topCategories.map((item) => item.category);
  const data = topCategories.map((item) => item.totalUnits);

  const ctx = document
    .getElementById("topCategoriesDoughnutChart")
    .getContext("2d");

  return new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Total Units",
          data: data,
          backgroundColor: [
            "#06285C",
            "#103D83",
            "#71CA66",
            "#FF9170",
            "#FEB152",
          ],

          hoverOffset: 4,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: false,
        },
      },
    },
  });
}

function renderTotalUnits(units) {
  const totalUnits = document.getElementById("totalUnits");
  totalUnits.textContent = units;
}

function renderAverageSales(average) {
  const averageSales = document.getElementById("averageSales");
  averageSales.textContent = formatter.format(average);
}

function renderTopCategories(topCategories) {
  const topCategoriesListElement = document.getElementById("topCategoriesList");
  topCategoriesListElement.innerHTML = "";

  topCategories.forEach((item, index) => {
    const listItem = document.createElement("div");
    listItem.textContent = `${index + 1}. ${item.category}: ${item.totalSales}`;
    topCategoriesListElement.appendChild(listItem);
  });
}

// Function to render all the charts
function render(filter) {
  // Destroy previous charts if they exist
  if (totalMonthlySaleChart !== null) {
    totalMonthlySaleChart.destroy();
  }

  if (topCategoriesChart !== null) {
    topCategoriesChart.destroy();
  }
  if (bottomCategoriesChart !== null) {
    bottomCategoriesChart.destroy();
  }
  if (HighestCategoriesChart !== null) {
    HighestCategoriesChart.destroy();
  }
  if (totalUnitCategoriesChart !== null) {
    totalUnitCategoriesChart.destroy();
  }
  if (tableDataset !== null) {
    tableDataset.destroy();
  }

  // Update total sales
  renderTotalSales(filter.getTotalSales());

  // Update total units
  renderTotalUnits(filter.getTotalUnits());

  // Update average sales
  renderAverageSales(filter.getAverageSales());

  // Extract datasets and labels from the total monthly sales filter
  const { datasets, labels } = filter.getTotalMonthlySales();
  // Render the total monthly sales chart
  totalMonthlySaleChart = renderCharts(labels, datasets);

  // Get the top categories by sales from the filter
  const topCategories = filter.getTopCategories();
  // Render the top categories horizontal bar chart
  topCategoriesChart = renderTopCategoriesHorizontalBarChart(topCategories);

  // Get the bottom categories by sales from the filter
  const bottomCategories = filter.getBottomCategories();
  // Render the bottom categories horizontal bar chart
  bottomCategoriesChart =
    renderBottomCategoriesHorizontalBarChart(bottomCategories);

  // Get the top categories by units from the filter
  const topCategoriesByUnits = filter.getTopCategoriesByUnits();
  // Render the top categories doughnut chart by units
  totalUnitCategoriesChart =
    renderTopCategoriesDoughnutChartByUnits(topCategoriesByUnits);

  // Get the filtered data from the filter
  const dataTable = filter.getFilteredData();
  // Create and populate the sales table with the filtered data
  tableDataset = createSalesTable(dataTable);
}
