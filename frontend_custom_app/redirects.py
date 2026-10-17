
import frappe

STUDENT_ROLES = {"Student"}
IGNORED_ROLES = {"All", "Guest", "Desk User"}
STAFF_ROLES = {"Administrator", "System Manager", "Instructor"}


def get_role_home_page(user):
    if not user or user == "Guest":
        return None

    roles = set(frappe.get_roles(user))

    if "Student" in roles and not (roles - STUDENT_ROLES - IGNORED_ROLES):
        return "student-portal"

    # A valid linked Student record is enough even when the account
    # does not hold the Student role yet (same rule as the on_login
    # hook in backend_custom_app.api.login_redirect). Staff - including
    # instructors - keep their existing desk redirect.
    if not (roles & STAFF_ROLES):
        try:
            from backend_custom_app.api.permissions import get_student_record

            if get_student_record(user):
                return "student-portal"
        except ImportError:
            pass

    return "desk"