  import "leaflet/dist/leaflet.css";
  import "leaflet.control.layers.tree/L.Control.Layers.Tree.css";
  import "leaflet.control.layers.tree";
  import L from "leaflet";
  import styles from "./Map.module.css";
  import { useEffect, useRef, useState} from "react"; 
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
    { layertable: "gis:htsd_dat_fix2000", layername: "Hiện trạng sử dụng đất 2024", style:"hientrangsudungdat2024" },
  ];
  interface MarkerPoint {
    TenDonVi: string;
    TenChuDonVi: string;
    Longtitude: number;
    Lattitude: number;
    Desc: string;
    _ID: string;
    LoaiHinh: string;
    DienTichSX: string;
    LienHe: string;
    TrangThai: string;
    Enabel: boolean;
    Tooltip: string;
    Enable_Maps: boolean;
  }

  export default function Map() {
    const mapRef = useRef<L.Map | null>(null);
    const [markers, setMarkers] = useState<MarkerPoint[]>([]);
    console.log(markers);
    useEffect(() => {
      const map = L.map("map", {
        center: [18.34, 105.90],
        zoom: 10,
        attributionControl: false,
      });
      mapRef.current = map;

      // Red points 
      const redIcon = L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
     fetch("https://agrizone.techsolutions.vn/rest/maps/v1/htx_trangtrai",{
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    // Nếu API cần token thì thêm:
    // "Authorization": "Bearer YOUR_TOKEN"
  }
})
      .then((res) => res.json())
      .then((data: MarkerPoint[]) => {   
        setMarkers(data);
        data.forEach((m: MarkerPoint) => {   
          if (!m.Enable_Maps) return;

          const lat = Number(m.Lattitude);
          const lng = Number(m.Longtitude);

          const popupHtml = `
              <div style="
                font-family: Arial, sans-serif;
                width: 260px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
              ">

                <div style="
                  background: #3b82f6;
                  color: white;
                  padding: 8px 12px;
                  font-size: 16px;
                  font-weight: bold;
                ">
                  ${m.TenDonVi}
                </div>

                <div style="padding: 10px 12px; font-size: 14px; line-height: 1.4;">

                  <div style="margin-bottom: 6px;">
                    <strong>Chủ đơn vị:</strong><br/>
                    ${m.TenChuDonVi}
                  </div>

                  <div style="margin-bottom: 6px;">
                    <strong>Diện tích:</strong> ${m.DienTichSX} m²
                  </div>

                  <div style="margin-bottom: 6px;">
                    <strong>Liên hệ:</strong> ${m.LienHe}
                  </div>

                  <div style="
                    margin-top: 6px;
                    padding: 6px;
                    background: #f3f4f6;
                    border-radius: 6px;
                    max-height: 100px;
                    overflow-y: auto;
                  ">
                    ${m.Desc}
                  </div>

                </div>
              </div>  
              <div style="font-family: Arial; min-width: 130px; padding:8px; text-align:center;">
                  <button 
                    style="
                      padding: 8px 12px;
                      background: #f97316;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                    "
                    onclick="window.open('https://www.windy.com/${lat}/${lng}?${lat},${lng},20', '_blank')"
                  >
                    Xem thời tiết
                  </button>
                </div>
            `;


          L.marker([lat, lng], { icon: redIcon })
            .bindPopup(popupHtml)
            .bindTooltip(m.Tooltip ?? m.TenDonVi)
            .addTo(map);
        });
      });


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
      //
          map.on("click", function (e) {
            const { lat, lng } = e.latlng;

            L.popup()
              .setLatLng(e.latlng)
              .setContent(`
                <div style="font-family: Arial; min-width: 130px;">
                  <h3 style="margin-top: 0; font-size: 16px; color: #007bff;">Tọa độ</h3>

                  <div style="padding: 8px 0;">
                    <b>Vĩ độ:</b> ${lat.toFixed(6)} <br>
                    <b>Kinh độ:</b> ${lng.toFixed(6)}
                  </div>

                  <button 
                    style="
                      padding: 8px 12px;
                      background: #f97316;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                    "
                    onclick="window.open('https://www.windy.com/${lat}/${lng}?${lat},${lng},20', '_blank')"
                  >
                    Xem thời tiết
                  </button>
                </div>
              `)
              .openOn(map);
          });

      // Cleanup when unmount
      return () => {
        map.remove();
      };
    }, []);
    
    return (
        <div>
          <div id="map" style={{ height: "100vh", width: "100%" } } />
        </div>
    );
  }
