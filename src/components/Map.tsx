  import "leaflet/dist/leaflet.css";
  import "leaflet.control.layers.tree/L.Control.Layers.Tree.css";
  import "leaflet.control.layers.tree";
  import L from "leaflet";
  import styles from "./Map.module.css";
  import { useEffect, useRef} from "react";
  export interface Layer {
    layertable: string,
    layername: string,
    style?: string,
  } 
  const layers: Layer[] = [
    //Biển đảo Việt Nam
    { layertable: "gis:biendao", layername: "Biển đảo", style: "biendao" },
    // Giao thông
    { layertable: "gis:giaothong", layername: "Giao thông", style: "giaothong" },
    { layertable: "gis:duongsat", layername: "Đường sắt",style: "duongsat" },

    // Thủy văn
    { layertable: "gis:matnuocsongsuoi_new", layername: "Mặt nước sông, suối",style: "matnuocsongsuoi" },
    { layertable: "gis:mangluoithuyvan", layername: "Mạng lưới thủy văn", style: "mangluoithuyvan" },
    { layertable: "gis:kenhmuongthuyloi", layername: "Kênh mương thủy lợi",style: "kenhmuongthuyloi" },

    // Biên giới - Địa giới
     { layertable: "gis:rg_tinh_new", layername: "Ranh giới tỉnh", style: "rg_tinh_new"},
    { layertable: "gis:rg_kcnc_new", layername: "Ranh giới xã",style: "rg_kvnc_new"},
   
    { layertable: "gis:htsd_dat_fix2000", layername: "Hiện trạng sử dụng đất 2024" },
  ];
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

      const terrain = L.tileLayer(
        "https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg",
        { maxZoom: 18 }
      );

      // map initial layer
      street.addTo(map);

      const baseMaps: Record<string, L.TileLayer> = {
        "Street Map": street,
        "Satellite": satellite,
        "Terrain": terrain,
      };

      // --- WMS LAYERS ---
      const GEOSERVER_URL = "https://geodb.techsolutions.vn/";
      const wmsLayers: Record<string, L.TileLayer.WMS> = layers.reduce((acc, cur) => {
        acc[cur.layername] = L.tileLayer.wms(GEOSERVER_URL, {
          layers: cur.layertable,
          format: "image/png",
          transparent: true,
            ...(cur.style && { styles: cur.style }),
        });
        return acc;
      }, {} as Record<string, L.TileLayer.WMS>);
      const waterGroup = {
        label: "Thủy văn",
        children: [
          { label: "Mặt nước sông, suối", layer: wmsLayers["Mặt nước sông, suối"] },
          { label: "Mạng lưới thủy văn", layer: wmsLayers["Mạng lưới thủy văn"] },
          { label: "Kênh mương thủy lợi", layer: wmsLayers["Kênh mương thủy lợi"] },
        ],
      };

      const trafficGroup = {
        label: "Giao thông",
        children: [
          { label: "Giao thông", layer: wmsLayers["Giao thông"] },
          { label: "Đường sắt", layer: wmsLayers["Đường sắt"] },
        ],
      };

      const borderGroup = {
        label: "Biên giới - Địa giới",
        children: [
          { label: "Ranh giới tỉnh", layer: wmsLayers["Ranh giới tỉnh"] },
          { label: "Ranh giới xã", layer: wmsLayers["Ranh giới xã"] },
          
           { label: "Hiện trạng sử dụng đất 2024", layer: wmsLayers["Hiện trạng sử dụng đất 2024"] },
        ],
      };
      // Control layer: Base map + Overlay WMS
      L.control.layers(baseMaps).addTo(map);

      // --- TREE CONTROL ---
      (L.control.layers as any)
        .tree(
          null,
          { label: "Hà Tĩnh", children: [waterGroup, trafficGroup, borderGroup] },
          { collapsed: false }
        )
        .addTo(map);
      
      // Turn on some WMS layers by default
      // wmsLayers["Mạng dòng chảy"].addTo(map);
      // wmsLayers["Sông - Suối"].addTo(map);
       wmsLayers["Biển đảo"].addTo(map);
      // Hoàng Sa
      L.marker([16.551389, 112.338889], {
        icon: L.divIcon({
          className: styles.islandLabel,
          html: "Quần đảo Hoàng Sa (Việt Nam)",
          iconSize: [0, 0]
        })
      }).addTo(map);

      // Trường Sa
      L.marker([10.911667, 114.242500], {
        icon: L.divIcon({
          className: styles.islandLabel,
          html: "Quần đảo Trường Sa (Việt Nam)",
          iconSize: [0, 0]
        })
      }).addTo(map);

      // Cleanup when unmount
      return () => {
        map.remove();
      };
    }, []);
    
    return (
        <div id="map" style={{ height: "100vh", width: "100%" } } />
    );
  }
