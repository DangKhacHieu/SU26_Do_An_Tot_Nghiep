# System Architecture - Food Haven (STMM)

Tài liệu này mô tả sơ đồ kiến trúc hệ thống đầy đủ (Full System Architecture) theo phong cách slide bài giảng chuẩn (University Style) với các đường kết nối **gấp khúc (ortho)** ở ngoài vỏ bọc tầng (Package-to-Package), đồng thời thể hiện **tương tác nội bộ** giữa các thành phần bên trong **Business Logic Layer**.

---

## 1. Sơ đồ Kiến trúc Hệ thống (Mermaid)

Dưới đây là sơ đồ chi tiết biểu diễn luồng đi của Request/Response ở cấp độ tầng và chi tiết kết nối nội bộ:

```mermaid
graph LR
    %% Định nghĩa Style cho các lớp
    classDef presLayer fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1,font-weight:bold;
    classDef bizLayer fill:#efebe9,stroke:#4e342e,stroke-width:2px,color:#3e2723,font-weight:bold;
    classDef dalLayer fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#1b5e20,font-weight:bold;
    classDef dataLayer fill:#fffde7,stroke:#fbc02d,stroke-width:2px,color:#f57f17,font-weight:bold;
    classDef component fill:#ffffff,stroke:#37474f,stroke-width:1.5px,font-weight:normal;

    %% Presentation Layer
    subgraph Presentation["Presentation Layer"]
        FE["Front End<br>(stmm-client)"]
    end
    class Presentation presLayer;
    class FE component;

    %% Business Logic Layer
    subgraph BLL["Business Logic Layer"]
        direction TB
        API["APIController"]
        Ctrl["Controller"]
        Svc["Service"]
        
        API -->|Calls| Svc
        Ctrl -->|Calls| Svc
    end
    class BLL bizLayer;
    class API,Ctrl,Svc component;

    %% Data Access Layer
    subgraph DAL["Data Access Layer"]
        Repo["Repository"]
    end
    class DAL dalLayer;
    class Repo component;

    %% Data Layer
    subgraph DL["Data Layer"]
        DB[("Database")]
    end
    class DL dataLayer;
    class DB component;

    %% Kết nối ngoài vỏ hộp (Tương ứng với slide gốc)
    Presentation ==>|Request| BLL
    BLL ==>|Response| Presentation

    BLL ==>|Request| DAL
    DAL ==>|Response| BLL

    DAL ==>|Request| DL
    DL ==>|Response| DAL
```

---

## 2. Mã nguồn PlantUML chuẩn Slide (Gấp khúc ngoài vỏ, tương tác trong)

Mã nguồn **PlantUML** dưới đây được tối ưu theo đúng mong muốn của bạn:
* Các đường mũi tên `Request` và `Response` sẽ nối trực tiếp vào **vỏ ngoài của các hộp lớn (Tầng/Package)**, không nối trực tiếp vào các thành phần nhỏ.
* Các mũi tên giao tiếp được cấu hình **gấp khúc 90 độ (`linetype ortho`)**.
* Có thể hiện **tương tác nội bộ** bên trong tầng Business Logic (`APIController` và `Controller` gọi tới `Service`).

```plantuml
@startuml System_Architecture_University_Style

' Cấu hình vẽ gấp khúc 90 độ
skinparam linetype ortho
skinparam packageStyle rect
skinparam Shadowing false
skinparam ArrowColor #37474F
skinparam ArrowThickness 1.5

' Định nghĩa các hằng số màu sắc cho các tầng
!define PRES_BG #E3F2FD
!define PRES_BORDER #1565C0
!define BLL_BG #EFEBE9
!define BLL_BORDER #4E342E
!define DAL_BG #E8F5E9
!define DAL_BORDER #2E7D32
!define DATA_BG #FFFDE7
!define DATA_BORDER #FBC02D

' 1. Presentation Layer (Vỏ ngoài)
package "Presentation Layer" as Presentation_Layer PRES_BG {
    component "Front End" as FE
}

' 2. Business Logic Layer (Vỏ ngoài)
package "Business Logic Layer" as Business_Logic_Layer BLL_BG {
    component "APIController" as API
    component "Service" as Service
    component "Controller" as Ctrl
    
    ' Tương tác nội bộ bên trong hộp Business Logic
    API ..> Service : <<use>>
    Ctrl ..> Service : <<use>>
}

' 3. Data Access Layer (Vỏ ngoài)
package "Data Access Layer" as Data_Access_Layer DAL_BG {
    component "Repository" as Repo
}

' 4. Data Layer (Vỏ ngoài)
package "Data Layer" as Data_Layer DATA_BG {
    database "Database" as DB
}

' --- Mũi tên kết nối ở ngoài các vỏ hộp (Package-to-Package) ---

Presentation_Layer -right-> Business_Logic_Layer : Request
Business_Logic_Layer -left-> Presentation_Layer : Response

Business_Logic_Layer -right-> Data_Access_Layer : Request
Data_Access_Layer -left-> Business_Logic_Layer : Response

Data_Access_Layer -right-> Data_Layer : Request
Data_Layer -left-> Data_Access_Layer : Response

@enduml
```
