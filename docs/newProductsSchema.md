# Emedix Jiffy — Products Table Schema Recommendation

| Field | Current | Recommended | Why |
|---|---|---|---|
| id | int PK | keep | |
| productName | varchar | keep | indexed |
| productCode | varchar | keep | |
| productCompany | varchar | keep | indexed |
| prescriptionRequired | varchar | boolean | you control import, normalize now |
| productPrice | varchar | decimal(10,2) | same reason |
| productDiscountPrice | varchar | decimal(10,2) | |
| productType | varchar | keep | |
| packagingOfMedicines | varchar | keep | |
| productComposition | text | varchar | indexed |
| status | varchar | enum('Enable','Disable') | |
| productStock | varchar | int | |
| lastUpdated | varchar | remove, use `updatedAt` | redundant |
| hsnCode | varchar | keep | |
| store_id | varchar | keep | |
| createdAt/updatedAt | datetime | keep | |