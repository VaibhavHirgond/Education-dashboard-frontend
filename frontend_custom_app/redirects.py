
import frappe

STUDENT_ROLES = {"Student"}
IGNORED_ROLES = {"All", "Guest", "Desk User"}


def get_role_home_page(user):
    if not user or user == "Guest":
        return None

    roles = set(frappe.get_roles(user))

    if "Student" in roles and not (roles - STUDENT_ROLES - IGNORED_ROLES):
        return "student-portal"

    return "desk"