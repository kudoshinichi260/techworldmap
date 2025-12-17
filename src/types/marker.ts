export interface MarkerPoint {
  _ID: string;

  TenDonVi: string;
  TenChuDonVi: string;

  Longtitude: number;
  Lattitude: number;

  DienTichSX: string;
  LoaiHinh: string;
  TrangThai: string;

  LienHe: string;
  Desc: string;

  Tooltip?: string;
  
  Enable_Maps: boolean;
  Enabel?: boolean;

  Images: [
      {
        "base_code": "string"
      } 
  ]
}
