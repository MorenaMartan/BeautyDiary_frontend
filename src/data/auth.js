import { clients } from "@/data/clientsData";
import { employeesData } from "@/data/employeesData";

export function getUsers() {
  return [
    ...employeesData.map((e) => ({ ...e, type: "employee" })),
    ...clients.map((c) => ({ ...c, role: "Client", type: "client" })),
  ];
}

export function login(username, password) {
  const user = getUsers().find(
    (u) => {
      const defaultPassword = u.name?.toLowerCase();
      const savedPassword = u.password?.startsWith("[")
        ? defaultPassword
        : u.password;

      return (
        u.username?.toLowerCase() === username.toLowerCase() &&
        savedPassword === password
      );
    },
  );

  if (user) {
    localStorage.setItem(
      "beautyDiaryUser",
      JSON.stringify({
        name: user.name,
        surname: user.surname,
        username: user.username,
        role: user.role,
        type: user.type,
        id: user.id,
      }),
    );
  }

  return user;
}

export function getCurrentUser() {
  const saved = localStorage.getItem("beautyDiaryUser");
  if (saved) return JSON.parse(saved);

  return { name: "Tara", username: "Tara", role: "Admin", type: "employee" };
}

export function logout() {
  localStorage.removeItem("beautyDiaryUser");
}
