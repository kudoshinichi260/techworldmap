  import "leaflet/dist/leaflet.css";
  import "leaflet.control.layers.tree/L.Control.Layers.Tree.css";
  import "leaflet.control.layers.tree";
  import L from "leaflet";
  import styles from "./Map.module.css";
  import "../index.css"
  import { useEffect, useRef, useState} from "react"; 
  import type { MarkerPoint } from "../types/marker";
  import { createRoot } from "react-dom/client";
  import { Switch } from "antd";
  import type { Layers } from "../types/layer";
  import { useLandMetadata } from "../hooks/useLandMetadata";
  import * as turf from "@turf/turf";
  import { findMetadataByCode } from "../utils/landMetadata.util";
  const GEOSERVER_WMS = "https://geodb.techsolutions.vn/geoserver/gis/wms";
  const GEOSERVER_WFS = "https://geodb.techsolutions.vn/geoserver/gis/wfs";
  const layers: Layers[] = [
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
    { layertable: "gis:htsd_dat_fix2000", layername: "Hiện trạng sử dụng đất 2024", 
      style:"hientrangsudungdat2024", wfs: true,popupFields: ["maloaidat"] },
  ];
  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const latStr = params.get("lat");
    const lngStr = params.get("lng");
    const zoomStr = params.get("zoom");
    return {
      id: params.get("id"),
      lat: latStr !== null ? Number(latStr) : null,
      lng: lngStr !== null ? Number(lngStr) : null,
      zoom: zoomStr !== null ? Number(zoomStr) : 13,
    };
  }
  
  function getMapWidthInKm(map: L.Map) {
    const bounds = map.getBounds();
    const left = bounds.getSouthWest();
    const right = bounds.getSouthEast();

    return map.distance(left, right) / 1000; // km
  }
  function base64ToImgSrc(base64: string, mime = "image/png") {
    return `data:${mime};base64,${base64}`;
  }
  const FALLBACK_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/6XK6k0AAAAASUVORK5CYII=";

  declare global {
    interface Window {
      popupSlides: any;
      slideNext: (id: string) => void;
      slidePrev: (id: string) => void;
    }
  }

  window.popupSlides = window.popupSlides || {};

  window.slideNext = (id: string) => {
    const data = window.popupSlides[id];
    if (!data) return;

    data.index = (data.index + 1) % data.images.length;
    const img = document.getElementById(`slide-img-${id}`) as HTMLImageElement;
    if (img) {
      img.src = base64ToImgSrc(data.images[data.index]);
    }
  };

  window.slidePrev = (id: string) => {
    const data = window.popupSlides[id];
    if (!data) return;

    data.index =
      (data.index - 1 + data.images.length) % data.images.length;
    const img = document.getElementById(`slide-img-${id}`) as HTMLImageElement;
    if (img) {
      img.src = base64ToImgSrc(data.images[data.index]);
    }
  };

  export default function Map() {
    const mapRef = useRef<L.Map | null>(null);
    const [markers, setMarkers] = useState<MarkerPoint[]>([]);
    console.log(markers);
    const markersRef = useRef<Record<string, L.Marker>>({});
    const pointsRef = useRef<MarkerPoint[]>([])

    const activeWfsLayer = useRef<Layers | null>(null);
    const wfsData = useRef<any>(null);
    const {data} =  useLandMetadata();

    useEffect(() => {
      if (!data.length) return;
      const map = L.map("map", {
        center: [18.34, 105.90],
        zoom: 10,
        attributionControl: false,
        zoomControl: false,
      });
      // Zoom control
      L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(map);
      // Zoom Meansure Control 
      const MeasureControl = L.Control.extend({
      onAdd() {
        const container = L.DomUtil.create("div");
        container.style.cssText = `
          background: white;
          padding: 0 10px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 14px;
        `;

        L.DomEvent.disableClickPropagation(container);

        const root = createRoot(container);

        root.render(
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>Đo khoảng cách</span>
                <Switch
                  size="small"
                  onChange={(checked) => {
                    isMeasuring = checked;

                    if (!checked) {
                      measurePoints = [];
                      measureLine?.remove();
                      measureTooltip?.remove();
                      measureMarkers.forEach((m) => m.remove());
                      measureMarkers = [];
                      measureLine = null;
                      measureTooltip = null;
                    }
                  }}
                />
              </div>
          );
          return container;
        },
      });

      map.addControl(new MeasureControl({ position: "bottomleft" }));
      // Scale ruler
      L.control.scale({
        position: "bottomleft", // bottomleft | bottomright | topleft | topright
        metric: true,           // m / km
        imperial: false,        // mile / feet
        maxWidth: 150           
      }).addTo(map);
      map.on("zoomend moveend", () => {
        const km = getMapWidthInKm(map);

        document.querySelectorAll(".island-label").forEach(el => {
          // Ra khỏi phạm vi quốc gia (~ > 1200km)
          if (km > 2000) {
            el.classList.add("zoom-far");
          } else {
            el.classList.remove("zoom-far");
          }
        });
      });

      mapRef.current = map;
      // ================= MEASURE TOOL =================
      let isMeasuring = false;
      let measurePoints: L.LatLng[] = [];
      let measureLine: L.Polyline | null = null;
      let measureTooltip: L.Tooltip | null = null;
      let measureMarkers: L.CircleMarker[] = [];
      map.doubleClickZoom.disable();

      function calcDistance(points: L.LatLng[]) {
        let d = 0;
        for (let i = 1; i < points.length; i++) {
          d += map.distance(points[i - 1], points[i]);
        }
        return d;
      }

      // Red points 
      const redIcon = L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      //https://agrizone.techsolutions.vn/rest/maps/v1/htx_trangtrai
     fetch("/point.json",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          // API key:
          // "Authorization": "Bearer YOUR_TOKEN"
        }
      })
      .then((res) => res.json())
      .then((data: MarkerPoint[]) => {   
        setMarkers(data);
        pointsRef.current = data;
        data.forEach((m: MarkerPoint) => {   
          
          const lat = Number(m.Lattitude);
          const lng = Number(m.Longtitude);
          const images =
          m.Images?.map((i) => i.base_code).filter(Boolean) ??
          [];

          // ✅ KHỞI TẠO SLIDE (có fallback)
          window.popupSlides[m._ID] = {
            index: 0,
            images: images.length ? images : [FALLBACK_BASE64],
          };

          const popupHtml = `
              <div style="
                font-family: Arial, sans-serif;
                width: 280px;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                border: 1px solid #e5e7eb;
                background-color: #ffffff;
              ">

                <!-- Hình ảnh đầu popup -->
                <div style="position: relative; width: 100%; height: 140px; overflow: hidden;">
                 <img 
                    id="slide-img-${m._ID}"
                    src="${base64ToImgSrc(
                      window.popupSlides[m._ID].images[0]
                    )}"
                    style="width:100%; height:100%; object-fit:cover;"
                  />

                <!-- Prev -->
                <button onclick="slidePrev('${m._ID}')" style="
                  position:absolute;
                  top:50%;
                  left:6px;
                  transform:translateY(-50%);
                  background:rgba(0,0,0,0.5);
                  color:white;
                  border:none;
                  border-radius:50%;
                  width:26px;
                  height:26px;
                  cursor:pointer;
                ">‹</button>

                <!-- Next -->
                <button onclick="slideNext('${m._ID}')" style="
                  position:absolute;
                  top:50%;
                  right:6px;
                  transform:translateY(-50%);
                  background:rgba(0,0,0,0.5);
                  color:white;
                  border:none;
                  border-radius:50%;
                  width:26px;
                  height:26px;
                  cursor:pointer;
                ">›</button>
              </div>


                <!-- Tiêu đề đơn vị -->
                <div style="
                  background: #1e3a8a;
                  color: white;
                  padding: 10px 14px;
                  font-size: 17px;
                  font-weight: bold;
                  text-align: center;
                ">
                  ${m.TenDonVi}
                </div>

                <!-- Nội dung thông tin -->
                <div style="padding: 12px 14px; font-size: 14px; line-height: 1.5; color: #111827;">

                  <div style="margin-bottom: 8px;">
                    <strong>Chủ đơn vị:</strong><br/>
                    ${m.TenChuDonVi}
                  </div>

                  <div style="margin-bottom: 8px;">
                    <strong>Diện tích:</strong> ${m.DienTichSX} m²
                  </div>

                  <div style="margin-bottom: 8px;">
                    <strong>Loại hình:</strong> ${m.LoaiHinh}
                  </div>

                  <div style="margin-bottom: 8px;">
                    <strong>Liên hệ:</strong> ${m.LienHe}
                  </div>

                  <!-- Mô tả -->
                  <div style="
                    margin-top: 10px;
                    padding: 8px;
                    background: #f9fafb;
                    border-left: 4px solid #3b82f6;
                    border-radius: 6px;
                    max-height: 100px;
                    overflow-y: auto;
                    font-size: 13px;
                    color: #374151;
                  ">
                    ${m.Desc}
                  </div>

                </div>
              </div>

              <!-- Nút xem thời tiết -->
              <div style="font-family: Arial; min-width: 130px; padding:10px; text-align:center;">
                <button 
                  style="
                    padding: 8px 14px;
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                  "
                  onclick="window.open('https://www.windy.com/${lat}/${lng}?${lat},${lng},20', '_blank')"
                >
                  Xem thời tiết
                </button>
              </div>

            `;

            const marker = L.marker([lat, lng], { icon: redIcon })
              .bindPopup(popupHtml)
              .bindTooltip(m.Tooltip ?? m.TenDonVi)
              .addTo(map);

            markersRef.current[m._ID] = marker;
        });
        const { id, lat, lng, zoom } = getUrlParams();

    /* Ưu tiên theo ID */
    if (id && markersRef.current[id]) {
      const marker = markersRef.current[id];
      map.flyTo(marker.getLatLng(), zoom, { animate: true });

      marker
        .bindTooltip(marker.getTooltip()?.getContent() ?? "", {
          permanent: true,
          direction: "top",
          offset: [0, -12],
          className: "farm-label",
        })
        .openTooltip();

      marker.openPopup();
      return;
    }

    /* Fallback theo lat/lng */
    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], zoom, { animate: true });

      const point = pointsRef.current.find(
        (p) =>
          Math.abs(Number(p.Lattitude) - lat) < 0.00001 &&
          Math.abs(Number(p.Longtitude) - lng) < 0.00001
      );

      if (!point) return;

      const marker = Object.values(markersRef.current).find((mk) => {
        const pos = mk.getLatLng();
        return (
          Math.abs(pos.lat - lat) < 0.00001 &&
          Math.abs(pos.lng - lng) < 0.00001
        );
      });

      if (marker) {
        marker
          .bindTooltip(point.TenDonVi, {
            permanent: true,
            direction: "top",
            offset: [0, -12],
            className: "farm-label",
          })
          .openTooltip();
      }
    }
      });
     
      //Search control
      // class SearchControl extends L.Control {
      //   onAdd() {
      //     const div = L.DomUtil.create("div");

      //     div.innerHTML = `
      //       <input id="farm-search"
      //         placeholder="Tìm trang trại..."
      //         style="width:220px; 
      //         padding:6px; 
      //         border-radius:6px; 
      //         border:1px solid #ccc"
      //       />
      //       <div id="farm-result"
      //         style="display:none; 
      //         background:white;
      //         max-height:220px;
      //         overflow:auto;
      //         border-radius:6px;
      //         box-shadow:0 2px 6px rgba(0,0,0,.3)">\
      //       </div>
      //     `;

      //     L.DomEvent.disableClickPropagation(div);

      //     setTimeout(() => {
      //       const input = document.getElementById(
      //         "farm-search"
      //       ) as HTMLInputElement;
      //       const box = document.getElementById(
      //         "farm-result"
      //       ) as HTMLDivElement;

      //       input.oninput = () => {
      //         const key = input.value.toLowerCase().trim();
      //         box.innerHTML = "";

      //         if (!key) {
      //           box.style.display = "none";
      //           return;
      //         }

      //         const results = pointsRef.current.filter(
      //           (p) =>
      //             p.Enable_Maps &&
      //             p.TenDonVi.toLowerCase().includes(key)
      //         );

      //         results.forEach((p) => {
      //           const item = document.createElement("div");
      //           item.style.padding = "6px";
      //           item.style.cursor = "pointer";
      //           item.innerHTML = `<b>${p.TenDonVi}</b><br/><small>${p.TenChuDonVi}</small>`;

      //           item.onclick = () => {
      //             const marker = markersRef.current[p._ID];
      //             if (!marker) return;

      //             map.setView(marker.getLatLng(), 12, { animate: true });
      //             marker.openPopup();

      //             box.style.display = "none";
      //             input.value = p.TenDonVi;
      //           };

      //           box.appendChild(item);
      //         });

      //         box.style.display = results.length ? "block" : "none";
      //       };
      //     });

      //     return div;
      //   }
      // }
      //  map.addControl(new SearchControl({ position: "topleft" }));
      
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
      
      const wmsLayers: Record<string, L.TileLayer.WMS> = layers.reduce((acc, cur) => {
        acc[cur.layername] = L.tileLayer.wms(GEOSERVER_WMS, {
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
      /* ---------- LOAD WFS KHI BẬT LAYER ---------- */
      map.on("overlayadd", (e: any) => {
        const layer = layers.find(
          (l) => wmsLayers[l.layername] === e.layer
        );
        if (layer) loadWFS(layer);
      });

      map.on("overlayremove", () => {
        activeWfsLayer.current = null;
        wfsData.current = null;
      });
      // Turn on some WMS layers by default
      wmsLayers["Biển đảo"].addTo(map);
      // Hoàng Sa
      L.marker([16.551389, 112.338889], {
        icon: L.divIcon({
          className: styles.islandLabel,
          html: `<div class="island-label">Quần đảo Hoàng Sa (Việt Nam)</div>`,
          iconSize: [0, 0]
        })
      }).addTo(map);

      // Trường Sa
      L.marker([10.911667, 114.242500], {
        icon: L.divIcon({
          className: styles.islandLabel,
          html: `<div class="island-label">Quần đảo Trường Sa (Việt Nam)</div>`,
          iconSize: [0, 0]
        })
      }).addTo(map);
      //
      map.on("click", function (e) {
        const { lat, lng } = e.latlng;
        // ===== MODE ĐO =====

        if (isMeasuring) {
          measurePoints.push(e.latlng);

          const pointMarker = L.circleMarker(e.latlng, {
          radius: 5,
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: 1,
          weight: 2,
        }).addTo(map);

        measureMarkers.push(pointMarker);

          if (!measureLine) {
            measureLine = L.polyline(measurePoints, {
              color: "red",
              weight: 3,
              dashArray: "5,5",
            }).addTo(map);
          } else {
            measureLine.setLatLngs(measurePoints);
          }

          const distance = calcDistance(measurePoints);
          const text =
            distance > 1000
              ? `${(distance / 1000).toFixed(2)} km`
              : `${Math.round(distance)} m`;

          if (!measureTooltip) {
            measureTooltip = L.tooltip({
              permanent: true,
              direction: "top",
              className: "measure-tooltip",
            })
              .setLatLng(e.latlng)
              .setContent(text)
              .addTo(map);
          } else {
            measureTooltip.setLatLng(e.latlng).setContent(text);
          }

          return; 
        }

        //
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
      map.on("dblclick", () => {
        if (!isMeasuring) return;

        measurePoints = [];
        measureLine?.remove();
        measureTooltip?.remove();
        measureMarkers.forEach((m) => m.remove()); 
        measureMarkers = [];
        measureLine = null;
        measureTooltip = null;
      });
      /* ---------- CLICK MAP → POPUP ---------- */
      map.on("click", async (e) => {
        if (!wfsData.current || !activeWfsLayer.current) return;

        const p = turf.point([e.latlng.lng, e.latlng.lat]);

        const feature = wfsData.current.features.find((f: any) => {
          try {
            return turf.booleanPointInPolygon(p, f);
          } catch {
            return false;
          }
      });

      if (!feature) return;
      const fields = activeWfsLayer.current.popupFields;
      const html = `
        <div style="font-family: Arial; font-size:14px">
          ${
            fields
              ? fields
                  .map(
                    (f) =>
                      `<b>${feature.properties?.[f] ??  "N/A"} -
                      ${findMetadataByCode(feature.properties?.[f], data)}
                    ` 
                  )
                  .join("<br/>")
              : ""
          }
        </div>
      `;

      L.popup()
        .setLatLng(e.latlng)
        .setContent(html)
        .openOn(map);
    });

    return () => {
      map.remove();
    };
      // Cleanup when unmount
      return () => {
        map.remove();
      };
    }, [data]);
    /* ---------- LOAD WFS ---------- */
  function loadWFS(layer: Layers) {
    if (!layer.wfs) {
      activeWfsLayer.current = null;
      wfsData.current = null;
      return;
    }

    fetch(
      `${GEOSERVER_WFS}?service=WFS&version=1.0.0&request=GetFeature&typeName=${layer.layertable}&outputFormat=application/json&srsName=EPSG:4326`
    )
      .then((r) => r.json())
      .then((data) => {
        wfsData.current = data;
        activeWfsLayer.current = layer;
      });
  }
    return (
        <div>
          <div id="map" style={{ height: "100vh", width: "100%" } } />
        </div>
    );
  }
