// Buat nampilin map secara global

async function fetchData() {
  const data = await fetch("./json/DatasetNycPropertySales.json").then((res) =>
    res.json()
  );
  return data;
}

let geojson;
let info = L.control();
async function main() {
  const data = await fetchData();
  const zipCodeSalePrice = data.reduce((acc, curr) => {
    const key = curr["ZIP CODE"];
    let salePrice = curr["SALE PRICE"];

    // Mengubah SALE PRICE dari string ke number jika perlu
    if (typeof salePrice === "string") {
      salePrice = Number(salePrice.split(".").join(""));
    }
    salePrice = Math.round(salePrice);

    if (!(key in acc)) {
      acc[key] = salePrice;
    } else {
      acc[key] += salePrice;
    }

    return acc;
  }, {});
  const mappedGeoJsonData = {
    type: "FeatureCollection",
    features: geojsonData.features.map((item) => {
      return {
        ...item,
        properties: {
          ...item.properties,
          salePrice: zipCodeSalePrice[item.properties.postalCode] || 0,
        },
      };
    }),
  };

  info.onAdd = function (map) {
    this._div = L.DomUtil.create("div", "info"); // create a div with a class "info"
    this.update();
    return this._div;
  };

  const formatter = new Intl.NumberFormat("en-US", { currency: "USD" });

  // method that we will use to update the control based on feature properties passed
  info.update = function (props) {
    this._div.innerHTML =
      "<h4>Sale Price</h4>" +
      (props
        ? "<b>" +
          props.borough +
          "</b><br />$" +
          formatter.format(props.salePrice)
        : "Hover over a state");
  };

  var map = L.map("map", {
    scrollWheelZoom: false,
  }).setView([40.7447677, -73.8947312], 10);

  info.addTo(map);

  var tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  geojson = L.geoJson(mappedGeoJsonData, { style, onEachFeature }).addTo(map);
}

main();

function getColor(d) {
  return d > 396865891
    ? "#06285C"
    : d > 352769681
    ? "#1A3C70"
    : d > 308673471
    ? "#2D5084"
    : d > 264577261
    ? "#406498"
    : d > 220481051
    ? "#5478AC"
    : d > 176384841
    ? "#688CC0"
    : d > 132288631
    ? "#7CA0D4"
    : d > 110240526
    ? "#8FB4E8"
    : d > 88192421
    ? "#A3C8FC"
    : d > 66144316
    ? "#B7DCFF"
    : d > 44096211
    ? "#CBF0FF"
    : d > 22048106
    ? "#DFF4FF"
    : d > 22_048_105
    ? "#F3FFFF"
    : "#FFFFFF"; // lightest
}

function style(feature) {
  return {
    fillColor: getColor(feature.properties.salePrice),
    weight: 2,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.7,
  };
}

function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 5,
    color: "#666",
    dashArray: "",
    fillOpacity: 0.7,
  });

  info.update(layer.feature.properties);

  layer.bringToFront();
}

function resetHighlight(e) {
  geojson.resetStyle(e.target);
  info.update();
}

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature,
  });
}
