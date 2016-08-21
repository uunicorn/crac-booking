from rest_framework import permissions

class DoorCombinationPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.session.get('door-combination', False)
