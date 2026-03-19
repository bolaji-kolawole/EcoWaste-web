export const adminModels = [
  {
    name: "Users",
    key: "users",
    service: "userService",
    fields: [
      "external_id",
      "name",
      "email",
      "phone"
    ]
  },

  {
    name: "Waste Requests",
    key: "waste_requests",
    service: "wasteRequestService",
    fields: [
      "external_id",
      "user_id",
      "waste_type_id",
      "quantity",
      "status"
    ]
  },

  {
    name: "Recycling Companies",
    key: "recycling_companies",
    service: "recyclingCompanyService",
    fields: [
      "external_id",
      "name",
      "email",
      "phone"
    ]
  }
];