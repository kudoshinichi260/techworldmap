import styles from "./Popup.module.css";

interface FormPopupProps {
  lat: number;
  lng: number;
  onClose: () => void;
}

export default function Popup({ lat, lng, onClose }: FormPopupProps) {

  const windyUrl = `https://www.windy.com/?wind,surface,'${lat}/${lng}?${lat},${lng},20`;

  const openWindy = () => {
    window.open(windyUrl, "_blank");
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.box}>
        <h3>Tọa độ</h3>
        <p>
          <b>Lat:</b> {lat.toFixed(6)} <br />
          <b>Lng:</b> {lng.toFixed(6)}
        </p>

        <div className={styles.buttonRow}>
          <button className={styles.btnSecondary} onClick={onClose}>
            Đóng
          </button>

          <button className={styles.btnPrimary} onClick={openWindy}>
            Xem trên Windy
          </button>
        </div>
      </div>
    </div>
  );
}
