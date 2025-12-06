  import "leaflet/dist/leaflet.css";
  import "leaflet.control.layers.tree/L.Control.Layers.Tree.css";
  import "leaflet.control.layers.tree";
  import L from "leaflet";
  import { useEffect, useRef} from "react";
  export default function Map() {
    const mapRef = useRef<L.Map | null>(null);
    useEffect(() => {
      const map = L.map("map", {
        center: [18.34, 105.90],
        zoom: 10,
        attributionControl: false,
      });
      mapRef.current = map;
      // --- BASE MAPS ---
      const street = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { maxZoom: 19 }
      );

      const satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      );

      const dark = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        { maxZoom: 19 }
      );

      const terrain = L.tileLayer(
        "https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg",
        { maxZoom: 18 }
      );

      // map initial layer
      street.addTo(map);

      const baseMaps: Record<string, L.TileLayer> = {
        "Street Map": street,
        "Satellite": satellite,
        "Dark Mode": dark,
        "Terrain": terrain,
      };

      // --- WMS LAYERS ---
      const GEOSERVER_URL = "https://geodb.techsolutions.vn/";
      const wmsLayers: Record<string, L.TileLayer.WMS> = {
        "Mạng dòng chảy": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:mangdongchay",
          format: "image/png",
          transparent: true,
        }),
        "Kênh mương": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:kenhmuongl",
          format: "image/png",
          transparent: true,
        }),
        "Mặt nước tĩnh": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:matnuoctinh",
          format: "image/png",
          transparent: true,
        }),
        "Đường bờ nước": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:duongbonuoc",
          format: "image/png",
          transparent: true,
        }),
        "Sông - Suối": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:matnuocsongsuoi",
          format: "image/png",
          transparent: true,
        }),
        "Địa danh biển đảo": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:diadanhbiendao",
          format: "image/png",
          transparent: true,
        }),
        "Đập p": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:dapp",
          format: "image/png",
          transparent: true,
        }),
        "Đập l": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:dapl",
          format: "image/png",
          transparent: true,
        }),
        "Đê l": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:del",
          format: "image/png",
          transparent: true,
        }),
        "Thác p": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:thacp",
          format: "image/png",
          transparent: true,
        }),
        "Bãi bồi a": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:baiboia",
          format: "image/png",
          transparent: true,
        }),
        "Biển đảo a": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:biendaoa",
          format: "image/png",
          transparent: true,
        }),
        "Bề mặt công trình dân cư": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:bematcongtrinhdanCu",
          format: "image/png",
          transparent: true,
        }),
        "Ranh giới phụ bề mặt": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:ranhgioiphubemat",
          format: "image/png",
          transparent: true,
        }),
        "Nước mặt": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:nuocmat",
          format: "image/png",
          transparent: true,
        }),
        "Rừng": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:rung",
          format: "image/png",
          transparent: true,
        }),
        "Phụ thực vật khác": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:phuthucvatkhac",
          format: "image/png",
          transparent: true,
        }),
        "Đất trồng": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:dattrong",
          format: "image/png",
          transparent: true,
        }),
        "Cây lâu năm": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:caylaunam",
          format: "image/png",
          transparent: true,
        }),
        "Cây hàng năm": L.tileLayer.wms(GEOSERVER_URL, {
          layers: "gis:cayhangnam",
          format: "image/png",
          transparent: true,
        }),
      };
      const waterGroup = {
        label: "Thủy văn",
        children: [
          { label: "Mạng dòng chảy", layer: wmsLayers["Mạng dòng chảy"] },
          { label: "Kênh mương", layer: wmsLayers["Kênh mương"] },
          { label: "Mặt nước tĩnh", layer: wmsLayers["Mặt nước tĩnh"] },
          { label: "Sông - Suối", layer: wmsLayers["Sông - Suối"] },
          { label: "Đập p", layer: wmsLayers["Đập p"] },
          { label: "Đập l", layer: wmsLayers["Đập l"] },
          { label: "Đê l", layer: wmsLayers["Đê l"] },
          { label: "Thác p", layer: wmsLayers["Thác p"] },
          { label: "Địa danh biển đảo", layer: wmsLayers["Địa danh biển đảo"] },
          { label: "Bãi bồi a", layer: wmsLayers["Bãi bồi a"] },
          { label: "Biển đảo a", layer: wmsLayers["Biển đảo a"] },
        ],
      };

      const surfaceGroup = {
        label: "Phủ bề mặt",
        children: [
          { label: "Bề mặt công trình dân cư", layer: wmsLayers["Bề mặt công trình dân cư"] },
          { label: "Ranh giới phụ bề mặt", layer: wmsLayers["Ranh giới phụ bề mặt"] },
          { label: "Nước mặt", layer: wmsLayers["Nước mặt"] },
          { label: "Rừng", layer: wmsLayers["Rừng"] },
          { label: "Phụ thực vật khác", layer: wmsLayers["Phụ thực vật khác"] },
          { label: "Đất trồng", layer: wmsLayers["Đất trồng"] },
          { label: "Cây lâu năm", layer: wmsLayers["Cây lâu năm"] },
          { label: "Cây hàng năm", layer: wmsLayers["Cây hàng năm"] },
        ],
      };


      // Control layer: Base map + Overlay WMS
      L.control.layers(baseMaps).addTo(map);

      // --- TREE CONTROL ---
      (L.control.layers as any)
        .tree(
          null,
          { label: "Hà Tĩnh", children: [waterGroup, surfaceGroup] },
          { collapsed: false }
        )
        .addTo(map);
      
      // Turn on some WMS layers by default
      // wmsLayers["Mạng dòng chảy"].addTo(map);
      wmsLayers["Sông - Suối"].addTo(map);
      
      // Cleanup when unmount
      return () => {
        map.remove();
      };
    }, []);
    
    return (
        <div id="map" style={{ height: "calc(100vh - 16px)", width: "100%" }} />
    );
  }
