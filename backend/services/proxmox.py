from typing import Dict, List, Optional, Any
from proxmoxer import ProxmoxAPI
from proxmoxer.core import ResourceException
import logging

from backend.core import settings


logger = logging.getLogger(__name__)


class CommonProxmoxService:
    """Service for managing Proxmox VE operations"""

    @staticmethod
    def get_connection(
        host: Optional[str] = None,
        port: Optional[int] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
        verify_ssl: bool = False,
    ) -> ProxmoxAPI:
        """
        Create a connection to Proxmox VE API

        Args:
            host: Proxmox host (defaults to settings)
            port: Proxmox port (defaults to settings)
            user: Proxmox user (defaults to settings)
            password: Proxmox password (defaults to settings)
            verify_ssl: Whether to verify SSL certificates

        Returns:
            ProxmoxAPI instance

        Raises:
            Exception: If connection fails
        """
        try:
            proxmox = ProxmoxAPI(
                host=host or settings.PROXMOX_HOST,
                port=port or settings.PROXMOX_PORT,
                user=user or settings.PROXMOX_USER,
                password=password or settings.PROXMOX_PASSWORD,
                verify_ssl=verify_ssl,
            )
            return proxmox
        except Exception as e:
            logger.error(f">>> Failed to connect to Proxmox: {str(e)}")
            raise Exception("Proxmox connection failed")

    @staticmethod
    def test_connection(
        host: str,
        port: int,
        user: str,
        password: str,
        verify_ssl: bool = False,
    ) -> Dict[str, Any]:
        """
        Test connection to Proxmox cluster

        Args:
            host (str): Proxmox host address
            port (int): Proxmox port number
            user (str): Proxmox username
            password (str): Proxmox user password
            verify_ssl (bool, optional): Whether to verify SSL certificates. Defaults to False.

        Returns:
            Dict with success status and version info or error message
        """
        try:
            proxmox = CommonProxmoxService.get_connection(
                host=host,
                port=port,
                user=user,
                password=password,
                verify_ssl=verify_ssl,
            )
            version_info = CommonProxmoxService.get_version(proxmox)
            return {
                "success": True,
                "task": {
                    "version": version_info.get("version"),
                    "release": version_info.get("release"),
                },
                "message": "Connection successful",
            }
        except Exception as e:
            logger.error(f">>> Connection test failed: {str(e)}")
            raise Exception("Proxmox connection test failed")

    @staticmethod
    async def get_version(proxmox: ProxmoxAPI) -> Dict[str, Any]:
        """
        Get Proxmox version information

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            Dict with version information
        """
        try:
            return proxmox.version.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get Proxmox version: {str(e)}")
            raise Exception("Failed to retrieve Proxmox version")

    @staticmethod
    async def get_task_status(
        proxmox: ProxmoxAPI, node: str, upid: str
    ) -> Dict[str, Any]:
        """
        Get status of a Proxmox task

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            upid (str): Unique task ID

        Returns:
            Dict with task status information
        """
        try:
            return proxmox.nodes(node).tasks(upid).status.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get task status: {str(e)}")
            raise Exception("Failed to retrieve task status")

    @staticmethod
    async def get_next_vmid(proxmox: ProxmoxAPI) -> int:
        """
        Get next available VM ID

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            Next available VM ID
        """
        try:
            return proxmox.cluster.nextid.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get next VM ID: {str(e)}")
            raise Exception("Failed to retrieve next VM ID")


class ProxmoxAccessService:
    """Service for managing Proxmox access control (users, groups, roles, permissions, ACLs)"""

    @staticmethod
    async def get_users(proxmox: ProxmoxAPI) -> List[Dict[str, Any]]:
        """
        Get list of all users

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            List of users with their details
        """
        try:
            return proxmox.access.users.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get users: {str(e)}")
            raise Exception("Failed to retrieve users")

    @staticmethod
    async def get_user(proxmox: ProxmoxAPI, userid: str) -> Dict[str, Any]:
        """
        Get specific user details

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            userid (str): User ID (format: username@realm, e.g., user@pam)

        Returns:
            User details
        """
        try:
            return proxmox.access.users(userid).get()
        except ResourceException as e:
            logger.error(f">>> Failed to get user {userid}: {str(e)}")
            raise Exception("Failed to retrieve user")

    @staticmethod
    async def create_user(
        proxmox: ProxmoxAPI,
        userid: str,
        password: Optional[str] = None,
        email: Optional[str] = None,
        firstname: Optional[str] = None,
        lastname: Optional[str] = None,
        groups: Optional[List[str]] = None,
        keys: Optional[str] = None,
        comment: Optional[str] = None,
        enable: bool = True,
        expire: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Create a new user

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            userid (str): User ID (format: username@realm)
            password (Optional[str]): User password
            email (Optional[str]): User email
            firstname (Optional[str]): First name
            lastname (Optional[str]): Last name
            groups (Optional[List[str]]): List of group names
            keys (Optional[str]): Key for two factor auth (2FA)
            comment (Optional[str]): Comment/description
            enable (bool): Enable user account
            expire (Optional[int]): Account expiration timestamp

        Returns:
            Success status
        """
        try:
            params = {"userid": userid}
            if password:
                params["password"] = password
            if email:
                params["email"] = email
            if firstname:
                params["firstname"] = firstname
            if lastname:
                params["lastname"] = lastname
            if groups:
                params["groups"] = ",".join(groups)
            if keys:
                params["keys"] = keys
            if comment:
                params["comment"] = comment
            if not enable:
                params["enable"] = 0
            if expire:
                params["expire"] = expire

            task = proxmox.access.users.post(**params)
            return {
                "success": True,
                "task": task,
                "message": f"User {userid} created",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to create user {userid}: {str(e)}")
            raise Exception("Failed to create user")

    @staticmethod
    async def update_user(
        proxmox: ProxmoxAPI,
        userid: str,
        password: Optional[str] = None,
        email: Optional[str] = None,
        firstname: Optional[str] = None,
        lastname: Optional[str] = None,
        groups: Optional[List[str]] = None,
        keys: Optional[str] = None,
        comment: Optional[str] = None,
        enable: bool = True,
        expire: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Update user details

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            userid (str): User ID
            password (Optional[str]): User password
            email (Optional[str]): User email
            firstname (Optional[str]): First name
            lastname (Optional[str]): Last name
            groups (Optional[List[str]]): List of group names
            keys (Optional[str]): Key for two factor auth (2FA)
            comment (Optional[str]): Comment/description
            enable (bool): Enable user account
            expire (Optional[int]): Account expiration timestamp

        Returns:
            Success status
        """
        try:
            params = {}
            if password:
                params["password"] = password
            if email:
                params["email"] = email
            if firstname:
                params["firstname"] = firstname
            if lastname:
                params["lastname"] = lastname
            if groups:
                params["groups"] = ",".join(groups)
            if keys:
                params["keys"] = keys
            if comment:
                params["comment"] = comment
            if not enable:
                params["enable"] = 0
            if expire:
                params["expire"] = expire

            task = proxmox.access.users(userid).put(**params)
            return {
                "success": True,
                "task": task,
                "message": f"User {userid} updated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to update user {userid}: {str(e)}")
            raise Exception("Failed to update user")

    @staticmethod
    async def delete_user(proxmox: ProxmoxAPI, userid: str) -> Dict[str, Any]:
        """
        Delete a user

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            userid (str): User ID

        Returns:
            Success status
        """
        try:
            task = proxmox.access.users(userid).delete()
            return {
                "success": True,
                "task": task,
                "message": f"User {userid} deleted",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to delete user {userid}: {str(e)}")
            raise Exception("Failed to delete user")

    @staticmethod
    async def change_user_password(
        proxmox: ProxmoxAPI,
        userid: str,
        password: str,
    ) -> Dict[str, Any]:
        """
        Change user password

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            userid (str): User ID
            password (str): New password

        Returns:
            Success status
        """
        try:
            task = proxmox.access.password.put(userid=userid, password=password)
            return {
                "success": True,
                "task": task,
                "message": f"Password changed for {userid}",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to change password for {userid}: {str(e)}")
            raise Exception("Failed to change user password")

    @staticmethod
    async def get_groups(proxmox: ProxmoxAPI) -> List[Dict[str, Any]]:
        """
        Get list of all groups

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            List of groups
        """
        try:
            return proxmox.access.groups.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get groups: {str(e)}")
            raise Exception("Failed to retrieve groups")

    @staticmethod
    async def get_group(proxmox: ProxmoxAPI, groupid: str) -> Dict[str, Any]:
        """
        Get specific group details

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            groupid (str): Group ID

        Returns:
            Group details
        """
        try:
            return proxmox.access.groups(groupid).get()
        except ResourceException as e:
            logger.error(f">>> Failed to get group {groupid}: {str(e)}")
            raise Exception("Failed to retrieve group")

    @staticmethod
    async def create_group(
        proxmox: ProxmoxAPI,
        groupid: str,
        comment: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a new group

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            groupid (str): Group ID
            comment (Optional[str]): Comment/description

        Returns:
            Success status
        """
        try:
            params = {"groupid": groupid}
            if comment:
                params["comment"] = comment

            task = proxmox.access.groups.post(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Group {groupid} created",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to create group {groupid}: {str(e)}")
            raise Exception("Failed to create group")

    @staticmethod
    async def update_group(
        proxmox: ProxmoxAPI,
        groupid: str,
        comment: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Update group details

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            groupid (str): Group ID
            comment (Optional[str]): New comment

        Returns:
            Success status
        """
        try:
            params = {}
            if comment:
                params["comment"] = comment

            task = proxmox.access.groups(groupid).put(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Group {groupid} updated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to update group {groupid}: {str(e)}")
            raise Exception("Failed to update group")

    @staticmethod
    async def delete_group(proxmox: ProxmoxAPI, groupid: str) -> Dict[str, Any]:
        """
        Delete a group

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            groupid (str): Group ID

        Returns:
            Success status
        """
        try:
            task = proxmox.access.groups(groupid).delete()
            return {
                "success": True,
                "task": task,
                "message": f"Group {groupid} deleted",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to delete group {groupid}: {str(e)}")
            raise Exception("Failed to delete group")

    @staticmethod
    async def get_roles(proxmox: ProxmoxAPI) -> List[Dict[str, Any]]:
        """
        Get list of all roles

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            List of roles with their privileges
        """
        try:
            return proxmox.access.roles.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get roles: {str(e)}")
            raise Exception("Failed to get roles")

    @staticmethod
    async def get_role(proxmox: ProxmoxAPI, roleid: str) -> Dict[str, Any]:
        """
        Get specific role details

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            roleid (str): Role ID

        Returns:
            Role details with privileges
        """
        try:
            return proxmox.access.roles(roleid).get()
        except ResourceException as e:
            logger.error(f">>> Failed to get role {roleid}: {str(e)}")
            raise Exception("Failed to get role")

    @staticmethod
    async def create_role(
        proxmox: ProxmoxAPI,
        roleid: str,
        privs: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a new role

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            roleid (str): Role ID
            privs (Optional[str]): Comma-separated list of privileges (e.g., 'VM.Allocate,VM.Console')

        Returns:
            Success status
        """
        try:
            params = {"roleid": roleid}
            if privs:
                params["privs"] = privs

            task = proxmox.access.roles.post(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Role {roleid} created",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to create role {roleid}: {str(e)}")
            raise Exception("Failed to create role")

    @staticmethod
    async def update_role(
        proxmox: ProxmoxAPI,
        roleid: str,
        privs: Optional[str] = None,
        append: bool = False,
    ) -> Dict[str, Any]:
        """
        Update role privileges

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            roleid (str): Role ID
            privs (Optional[str]): Comma-separated list of privileges
            append (bool): Append privileges instead of replacing

        Returns:
            Success status
        """
        try:
            params = {}
            if privs:
                params["privs"] = privs
            if append:
                params["append"] = 1

            task = proxmox.access.roles(roleid).put(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Role {roleid} updated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to update role {roleid}: {str(e)}")
            raise Exception("Failed to update role")

    @staticmethod
    async def delete_role(proxmox: ProxmoxAPI, roleid: str) -> Dict[str, Any]:
        """
        Delete a role

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            roleid (str): Role ID

        Returns:
            Success status
        """
        try:
            task = proxmox.access.roles(roleid).delete()
            return {
                "success": True,
                "task": task,
                "message": f"Role {roleid} deleted",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to delete role {roleid}: {str(e)}")
            raise Exception("Failed to delete role")

    @staticmethod
    async def get_acl(proxmox: ProxmoxAPI) -> List[Dict[str, Any]]:
        """
        Get Access Control List (ACL)

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            List of ACL entries
        """
        try:
            return proxmox.access.acl.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get ACL: {str(e)}")
            raise Exception("Failed to get ACL")

    @staticmethod
    async def update_acl(
        proxmox: ProxmoxAPI,
        path: str,
        roles: str,
        users: Optional[str] = None,
        groups: Optional[str] = None,
        propagate: bool = True,
        delete: bool = False,
        tokens: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Update ACL permissions

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            path (str): Access path (e.g., '/', '/vms/100', '/storage/local')
            roles (str): Comma-separated list of roles
            users (Optional[str]): Comma-separated list of users (format: username@realm)
            groups (Optional[str]): Comma-separated list of groups
            propagate (bool): Propagate permissions to child objects
            delete (bool): Delete permissions instead of adding
            tokens (Optional[str]): Comma-separated list of API tokens

        Returns:
            Success status
        """
        try:
            params = {
                "path": path,
                "roles": roles,
            }

            if users:
                params["users"] = users
            if groups:
                params["groups"] = groups
            if not propagate:
                params["propagate"] = 0
            if delete:
                params["delete"] = 1
            if tokens:
                params["tokens"] = tokens

            task = proxmox.access.acl.put(**params)
            action = "deleted" if delete else "updated"
            return {
                "success": True,
                "task": task,
                "message": f"ACL {action} for path {path}",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to update ACL for path {path}: {str(e)}")
            raise Exception("Failed to update ACL")

    @staticmethod
    async def get_domains(proxmox: ProxmoxAPI) -> List[Dict[str, Any]]:
        """
        Get authentication domains/realms

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            List of authentication domains
        """
        try:
            return proxmox.access.domains.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get domains: {str(e)}")
            raise Exception("Failed to get domains")

    @staticmethod
    async def get_permissions(
        proxmox: ProxmoxAPI,
        path: Optional[str] = None,
        userid: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get permissions for a user or path

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            path (Optional[str]): Access path to check
            userid (Optional[str]): User ID to check permissions for

        Returns:
            Permissions dictionary
        """
        try:
            params = {}
            if path:
                params["path"] = path
            if userid:
                params["userid"] = userid

            return proxmox.access.permissions.get(**params)
        except ResourceException as e:
            logger.error(f">>> Failed to get permissions: {str(e)}")
            raise Exception("Failed to get permissions")

    @staticmethod
    async def create_api_token(
        proxmox: ProxmoxAPI,
        userid: str,
        tokenid: str,
        comment: Optional[str] = None,
        expire: Optional[int] = None,
        privsep: bool = True,
    ) -> Dict[str, Any]:
        """
        Create API token for a user

        Args:
            proxmox: ProxmoxAPI instance
            userid: User ID (format: username@realm)
            tokenid: Token ID
            comment: Comment/description
            expire: Expiration timestamp
            privsep: Enable privilege separation (token has separate permissions)

        Returns:
            Token information including value
        """
        try:
            params = {"tokenid": tokenid}

            if comment:
                params["comment"] = comment
            if expire:
                params["expire"] = expire
            if not privsep:
                params["privsep"] = 0

            task = proxmox.access.users(userid).token.post(**params)
            return {
                "success": True,
                "task": task,
                "message": "Token created successfully",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to create API token for {userid}: {str(e)}")
            raise Exception("Failed to create API token")

    @staticmethod
    async def get_api_tokens(proxmox: ProxmoxAPI, userid: str) -> List[Dict[str, Any]]:
        """
        Get list of API tokens for a user

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            userid (str): User ID

        Returns:
            List of tokens
        """
        try:
            return proxmox.access.users(userid).token.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get API tokens for {userid}: {str(e)}")
            raise Exception("Failed to get API tokens")

    @staticmethod
    async def delete_api_token(
        proxmox: ProxmoxAPI,
        userid: str,
        tokenid: str,
    ) -> Dict[str, Any]:
        """
        Delete an API token

        Args:
            proxmox: ProxmoxAPI instance
            userid: User ID
            tokenid: Token ID

        Returns:
            Success status
        """
        try:
            task = proxmox.access.users(userid).token(tokenid).delete()
            return {
                "success": True,
                "task": task,
                "message": f"Token {tokenid} deleted for {userid}",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to delete token {tokenid} for {userid}: {str(e)}")
            raise Exception("Failed to delete API token")

    @staticmethod
    async def generate_tfa_secret(proxmox: ProxmoxAPI, userid: str) -> Dict[str, Any]:
        """
        Generate TOTP (Two-Factor Authentication) secret for a user

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            userid (str): User ID

        Returns:
            Success status with TFA secret details
        """
        try:
            task = proxmox.access.tfa.post(userid=userid, type="totp")
            return {
                "success": True,
                "task": task,
                "message": "TFA secret generated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to generate TFA secret for {userid}: {str(e)}")
            raise Exception("Failed to generate TFA secret")


class ProxmoxClusterService:
    """Service for managing Proxmox cluster operations"""

    @staticmethod
    async def get_cluster_status(proxmox: ProxmoxAPI) -> List[Dict[str, Any]]:
        """
        Get cluster status information

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            List of cluster status entries (nodes, quorum info, etc.)
        """
        try:
            return proxmox.cluster.status.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get cluster status: {str(e)}")
            raise Exception("Failed to get cluster status")

    @staticmethod
    async def get_cluster_resources(
        proxmox: ProxmoxAPI,
        resource_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get cluster resources (VMs, nodes, storage)

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            resource_type (Optional[str]): Filter by type ('vm', 'node', 'storage', 'sdn')

        Returns:
            List of cluster resources
        """
        try:
            params = {"type": resource_type} if resource_type else {}
            return proxmox.cluster.resources.get(**params)
        except ResourceException as e:
            logger.error(f">>> Failed to get cluster resources: {str(e)}")
            raise Exception("Failed to get cluster resources")

    @staticmethod
    async def get_cluster_options(proxmox: ProxmoxAPI) -> Dict[str, Any]:
        """
        Get cluster configuration options

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            Dict with cluster configuration (keyboard, language, email, etc.)
        """
        try:
            return proxmox.cluster.options.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get cluster options: {str(e)}")
            raise Exception("Failed to get cluster options")

    @staticmethod
    async def update_cluster_options(
        proxmox: ProxmoxAPI,
        keyboard: Optional[str] = None,
        language: Optional[str] = None,
        email_from: Optional[str] = None,
        http_proxy: Optional[str] = None,
        description: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Update cluster configuration options

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            keyboard (Optional[str]): Keyboard layout
            language (Optional[str]): Default language
            email_from (Optional[str]): Email from address
            http_proxy (Optional[str]): HTTP proxy server
            description (Optional[str]): Cluster description
            **kwargs: Additional cluster options

        Returns:
            Success status
        """
        try:
            params = {}
            if keyboard:
                params["keyboard"] = keyboard
            if language:
                params["language"] = language
            if email_from:
                params["email_from"] = email_from
            if http_proxy:
                params["http_proxy"] = http_proxy
            if description:
                params["description"] = description
            params.update(kwargs)

            task = proxmox.cluster.options.put(**params)
            return {
                "success": True,
                "task": task,
                "message": "Cluster options updated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to update cluster options: {str(e)}")
            raise Exception("Failed to update cluster options")

    @staticmethod
    async def get_cluster_tasks(proxmox: ProxmoxAPI) -> List[Dict[str, Any]]:
        """
        Get cluster task list

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            List of tasks
        """
        try:
            return proxmox.cluster.tasks.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get cluster tasks: {str(e)}")
            raise Exception("Failed to get cluster tasks")

    @staticmethod
    async def get_cluster_backup_schedule(proxmox: ProxmoxAPI) -> List[Dict[str, Any]]:
        """
        Get cluster backup schedule

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            List of backup jobs
        """
        try:
            return proxmox.cluster.backup.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get backup schedule: {str(e)}")
            raise Exception("Failed to get backup schedule")

    @staticmethod
    async def create_backup_job(
        proxmox: ProxmoxAPI,
        starttime: Optional[str],
        dow: Optional[str],
        storage: Optional[str] = None,
        vmid: Optional[str] = None,
        node: Optional[str] = None,
        all_vms: bool = False,
        compress: Optional[str] = None,
        mode: Optional[str] = None,
        mailnotification: Optional[str] = None,
        mailto: Optional[str] = None,
        enabled: bool = True,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Create cluster backup job

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            starttime (Optional[str]): Backup start time (HH:MM format)
            dow (Optional[str]): Day of week (mon, tue, wed, thu, fri, sat, sun or comma-separated)
            storage (Optional[str]): Storage for backups
            vmid (Optional[str]): VM IDs to backup (comma-separated) or 'all'
            node (Optional[str]): Only run on this node
            all_vms (bool): Backup all VMs
            compress (Optional[str]): Compression type ('0', 'lzo', 'gzip', 'zstd')
            mode (Optional[str]): Backup mode ('snapshot', 'suspend', 'stop')
            mailnotification (Optional[str]): When to send email ('always', 'failure')
            mailto (Optional[str]): Email recipients (comma-separated)
            enabled (bool): Enable backup job
            **kwargs: Additional backup options

        Returns:
            Success status with job ID
        """
        try:
            params = {}
            if starttime:
                params["starttime"] = starttime
            if dow:
                params["dow"] = dow
            if storage:
                params["storage"] = storage
            if vmid:
                params["vmid"] = vmid
            if node:
                params["node"] = node
            if all_vms:
                params["all"] = 1
            if compress:
                params["compress"] = compress
            if mode:
                params["mode"] = mode
            if mailnotification:
                params["mailnotification"] = mailnotification
            if mailto:
                params["mailto"] = mailto
            if not enabled:
                params["enabled"] = 0
            params.update(kwargs)

            task = proxmox.cluster.backup.post(**params)
            return {
                "success": True,
                "task": task,
                "message": "Backup job created",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to create backup job: {str(e)}")
            raise Exception("Failed to create backup job")

    @staticmethod
    async def update_backup_job(
        proxmox: ProxmoxAPI,
        job_id: str,
        starttime: Optional[str],
        dow: Optional[str],
        storage: Optional[str] = None,
        vmid: Optional[str] = None,
        node: Optional[str] = None,
        all_vms: bool = False,
        compress: Optional[str] = None,
        mode: Optional[str] = None,
        mailnotification: Optional[str] = None,
        mailto: Optional[str] = None,
        enabled: bool = True,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Update cluster backup job

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            job_id (str): Backup job ID
            **kwargs: Backup job parameters to update

        Returns:
            Success status
        """
        try:
            params = {}
            if starttime:
                params["starttime"] = starttime
            if dow:
                params["dow"] = dow
            if storage:
                params["storage"] = storage
            if vmid:
                params["vmid"] = vmid
            if node:
                params["node"] = node
            if all_vms:
                params["all"] = 1
            if compress:
                params["compress"] = compress
            if mode:
                params["mode"] = mode
            if mailnotification:
                params["mailnotification"] = mailnotification
            if mailto:
                params["mailto"] = mailto
            if not enabled:
                params["enabled"] = 0
            params.update(kwargs)

            task = proxmox.cluster.backup(job_id).put(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Backup job {job_id} updated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to update backup job {job_id}: {str(e)}")
            raise

    @staticmethod
    async def delete_backup_job(proxmox: ProxmoxAPI, job_id: str) -> Dict[str, Any]:
        """
        Delete cluster backup job

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            job_id (str): Backup job ID

        Returns:
            Success status
        """
        try:
            task = proxmox.cluster.backup(job_id).delete()
            return {
                "success": True,
                "task": task,
                "message": f"Backup job {job_id} deleted",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to delete backup job {job_id}: {str(e)}")
            raise Exception("Failed to delete backup job")

    @staticmethod
    async def get_cluster_ha_resources(proxmox: ProxmoxAPI) -> List[Dict[str, Any]]:
        """
        Get High Availability (HA) resources

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            List of HA resources
        """
        try:
            return proxmox.cluster.ha.resources.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get HA resources: {str(e)}")
            raise

    @staticmethod
    async def add_ha_resource(
        proxmox: ProxmoxAPI,
        sid: str,
        group: Optional[str] = None,
        max_restart: Optional[int] = None,
        max_relocate: Optional[int] = None,
        state: Optional[str] = None,
        comment: Optional[str] = None,
        fallback: bool = True,
    ) -> Dict[str, Any]:
        """
        Add resource to HA management

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            sid (str): Service ID (e.g., 'vm:100')
            group (Optional[str]): HA group name
            max_restart (Optional[int]): Maximum restart attempts
            max_relocate (Optional[int]): Maximum relocate attempts
            state (Optional[str]): Requested state ('started', 'stopped', 'enabled', 'disabled')
            comment (Optional[str]): Description
            fallback (bool): Fallback setting

        Returns:
            Success status
        """
        try:
            params = {"sid": sid}
            if group:
                params["group"] = group
            if max_restart:
                params["max_restart"] = max_restart
            if max_relocate:
                params["max_relocate"] = max_relocate
            if state:
                params["state"] = state
            if comment:
                params["comment"] = comment
            if not fallback:
                params["fallback"] = 0

            task = proxmox.cluster.ha.resources.post(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Resource {sid} added to HA",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to add HA resource {sid}: {str(e)}")
            raise Exception("Failed to add HA resource")

    @staticmethod
    async def update_ha_resource(
        proxmox: ProxmoxAPI,
        sid: str,
        group: Optional[str] = None,
        max_restart: Optional[int] = None,
        max_relocate: Optional[int] = None,
        state: Optional[str] = None,
        comment: Optional[str] = None,
        fallback: bool = True,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Update HA resource configuration

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            sid (str): Service ID
            group (Optional[str]): HA group name
            max_restart (Optional[int]): Maximum restart attempts
            max_relocate (Optional[int]): Maximum relocate attempts
            state (Optional[str]): Requested state ('started', 'stopped', 'enabled', 'disabled')
            comment (Optional[str]): Description
            fallback (bool): Fallback setting
            **kwargs: Parameters to update

        Returns:
            Success status
        """
        try:
            params = {}
            if group:
                params["group"] = group
            if max_restart:
                params["max_restart"] = max_restart
            if max_relocate:
                params["max_relocate"] = max_relocate
            if state:
                params["state"] = state
            if comment:
                params["comment"] = comment
            if not fallback:
                params["fallback"] = 0
            params.update(kwargs)

            task = proxmox.cluster.ha.resources(sid).put(**params)
            return {
                "success": True,
                "task": task,
                "message": f"HA resource {sid} updated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to update HA resource {sid}: {str(e)}")
            raise Exception("Failed to update HA resource")

    @staticmethod
    async def remove_ha_resource(proxmox: ProxmoxAPI, sid: str) -> Dict[str, Any]:
        """
        Remove resource from HA management

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            sid (str): Service ID

        Returns:
            Success status
        """
        try:
            task = proxmox.cluster.ha.resources(sid).delete()
            return {
                "success": True,
                "task": task,
                "message": f"Resource {sid} removed from HA",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to remove HA resource {sid}: {str(e)}")
            raise Exception("Failed to remove HA resource")

    @staticmethod
    async def get_cluster_ha_groups(proxmox: ProxmoxAPI) -> List[Dict[str, Any]]:
        """
        Get HA groups

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            List of HA groups
        """
        try:
            return proxmox.cluster.ha.groups.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get HA groups: {str(e)}")
            raise Exception("Failed to get HA groups")

    @staticmethod
    async def create_ha_group(
        proxmox: ProxmoxAPI,
        group: str,
        nodes: str,
        restricted: bool = False,
        nofailback: bool = False,
        comment: Optional[str] = None,
        type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create HA group

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            group (str): Group name
            nodes (str): Comma-separated list of nodes with optional priority (e.g., 'node1:2,node2:1')
            restricted (bool): Resources in this group can only run on specified nodes
            nofailback (bool): Disable failback to higher priority nodes
            comment (Optional[str]): Description
            type (Optional[str]): Type of HA group

        Returns:
            Success status
        """
        try:
            params = {
                "group": group,
                "nodes": nodes,
            }
            if restricted:
                params["restricted"] = 1
            if nofailback:
                params["nofailback"] = 1
            if comment:
                params["comment"] = comment
            if type:
                params["type"] = type

            task = proxmox.cluster.ha.groups.post(**params)
            return {
                "success": True,
                "task": task,
                "message": f"HA group {group} created",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to create HA group {group}: {str(e)}")
            raise Exception("Failed to create HA group")

    @staticmethod
    async def update_ha_group(
        proxmox: ProxmoxAPI,
        group: str,
        restricted: bool = False,
        nofailback: bool = False,
        comment: Optional[str] = None,
        type: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Update HA group

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            group (str): Group name
            restricted (bool): Resources in this group can only run on specified nodes
            nofailback (bool): Disable failback to higher priority nodes
            comment (Optional[str]): Description
            type (Optional[str]): Type of HA group
            **kwargs: Parameters to update

        Returns:
            Success status
        """
        try:
            params = {}
            if restricted:
                params["restricted"] = 1
            if nofailback:
                params["nofailback"] = 1
            if comment:
                params["comment"] = comment
            if type:
                params["type"] = type
            params.update(kwargs)

            task = proxmox.cluster.ha.groups(group).put(**params)
            return {
                "success": True,
                "task": task,
                "message": f"HA group {group} updated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to update HA group {group}: {str(e)}")
            raise Exception("Failed to update HA group")

    @staticmethod
    async def delete_ha_group(proxmox: ProxmoxAPI, group: str) -> Dict[str, Any]:
        """
        Delete HA group

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            group (str): Group name

        Returns:
            Success status
        """
        try:
            task = proxmox.cluster.ha.groups(group).delete()
            return {
                "success": True,
                "task": task,
                "message": f"HA group {group} deleted",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to delete HA group {group}: {str(e)}")
            raise Exception("Failed to delete HA group")

    @staticmethod
    async def get_cluster_ha_status(proxmox: ProxmoxAPI) -> Dict[str, Any]:
        """
        Get HA manager status

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            HA manager status
        """
        try:
            return proxmox.cluster.ha.status.current.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get HA status: {str(e)}")
            raise Exception("Failed to get HA status")

    @staticmethod
    async def get_cluster_firewall_groups(proxmox: ProxmoxAPI) -> List[Dict[str, Any]]:
        """
        Get cluster firewall security groups

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            List of firewall security groups
        """
        try:
            return proxmox.cluster.firewall.groups.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get firewall groups: {str(e)}")
            raise Exception("Failed to get firewall groups")

    @staticmethod
    async def create_firewall_group(
        proxmox: ProxmoxAPI,
        group: str,
        comment: Optional[str] = None,
        digest: Optional[str] = None,
        rename: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create cluster firewall security group

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            group (str): Security group name
            comment (Optional[str]): Description
            digest (Optional[str]): Digest
            rename (Optional[str]): New group name

        Returns:
            Success status
        """
        try:
            params = {"group": group}
            if comment:
                params["comment"] = comment
            if digest:
                params["digest"] = digest
            if rename:
                params["rename"] = rename

            proxmox.cluster.firewall.groups.post(**params)
            return {"success": True, "message": f"Firewall group {group} created"}
        except ResourceException as e:
            logger.error(f">>> Failed to create firewall group {group}: {str(e)}")
            raise Exception("Failed to create firewall group")

    @staticmethod
    async def delete_firewall_group(proxmox: ProxmoxAPI, group: str) -> Dict[str, Any]:
        """
        Delete cluster firewall security group

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            group (str): Security group name

        Returns:
            Success status
        """
        try:
            proxmox.cluster.firewall.groups(group).delete()
            return {"success": True, "message": f"Firewall group {group} deleted"}
        except ResourceException as e:
            logger.error(f">>> Failed to delete firewall group {group}: {str(e)}")
            raise Exception("Failed to delete firewall group")

    @staticmethod
    async def get_cluster_firewall_rules(proxmox: ProxmoxAPI) -> List[Dict[str, Any]]:
        """
        Get cluster firewall rules

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            List of cluster firewall rules
        """
        try:
            return proxmox.cluster.firewall.rules.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get firewall rules: {str(e)}")
            raise Exception("Failed to get firewall rules")

    @staticmethod
    async def create_firewall_rule(
        proxmox: ProxmoxAPI,
        action: str,
        type: str,
        enable: bool = True,
        source: Optional[str] = None,
        dest: Optional[str] = None,
        proto: Optional[str] = None,
        dport: Optional[str] = None,
        sport: Optional[str] = None,
        comment: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Create cluster firewall rule

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            action (str): Rule action ('ACCEPT', 'DROP', 'REJECT')
            type (str): Rule type ('in', 'out', 'group', 'forward')
            enable (bool): Enable rule
            source (Optional[str]): Source IP/CIDR
            dest (Optional[str]): Destination IP/CIDR
            proto (Optional[str]): Protocol (tcp, udp, icmp, etc.)
            dport (Optional[str]): Destination port
            sport (Optional[str]): Source port
            comment (Optional[str]): Rule description
            **kwargs: Additional rule options

        Returns:
            Success status with rule position
        """
        try:
            params = {
                "action": action,
                "type": type,
            }
            if not enable:
                params["enable"] = 0
            if source:
                params["source"] = source
            if dest:
                params["dest"] = dest
            if proto:
                params["proto"] = proto
            if dport:
                params["dport"] = dport
            if sport:
                params["sport"] = sport
            if comment:
                params["comment"] = comment
            params.update(kwargs)

            task = proxmox.cluster.firewall.rules.post(**params)
            return {
                "success": True,
                "task": task,
                "message": "Firewall rule created",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to create firewall rule: {str(e)}")
            raise Exception("Failed to create firewall rule")

    @staticmethod
    async def update_firewall_rule(
        proxmox: ProxmoxAPI,
        pos: int,
        action: Optional[str] = None,
        type: Optional[str] = None,
        enable: bool = True,
        source: Optional[str] = None,
        dest: Optional[str] = None,
        proto: Optional[str] = None,
        dport: Optional[str] = None,
        sport: Optional[str] = None,
        comment: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Update cluster firewall rule

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            pos (int): Rule position
            action (Optional[str]): Rule action ('ACCEPT', 'DROP', 'REJECT')
            type (Optional[str]): Rule type ('in', 'out', 'group', 'forward')
            enable (bool): Enable rule
            source (Optional[str]): Source IP/CIDR
            dest (Optional[str]): Destination IP/CIDR
            proto (Optional[str]): Protocol (tcp, udp, icmp, etc.)
            dport (Optional[str]): Destination port
            sport (Optional[str]): Source port
            comment (Optional[str]): Rule description
            **kwargs: Rule parameters to update

        Returns:
            Success status
        """
        try:
            params = {}
            if action:
                params["action"] = action
            if type:
                params["type"] = type
            if not enable:
                params["enable"] = 0
            if source:
                params["source"] = source
            if dest:
                params["dest"] = dest
            if proto:
                params["proto"] = proto
            if dport:
                params["dport"] = dport
            if sport:
                params["sport"] = sport
            if comment:
                params["comment"] = comment
            params.update(kwargs)

            task = proxmox.cluster.firewall.rules(pos).put(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Firewall rule {pos} updated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to update firewall rule {pos}: {str(e)}")
            raise Exception("Failed to update firewall rule")

    @staticmethod
    async def delete_firewall_rule(proxmox: ProxmoxAPI, pos: int) -> Dict[str, Any]:
        """
        Delete cluster firewall rule

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            pos (int): Rule position

        Returns:
            Success status
        """
        try:
            task = proxmox.cluster.firewall.rules(pos).delete()
            return {
                "success": True,
                "task": task,
                "message": f"Firewall rule {pos} deleted",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to delete firewall rule {pos}: {str(e)}")
            raise Exception("Failed to delete firewall rule")


class ProxmoxNodeService:
    """Service for managing Proxmox node operations"""

    @staticmethod
    async def get_nodes(proxmox: ProxmoxAPI) -> List[Dict[str, Any]]:
        """
        Get list of all nodes in the cluster

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            List of nodes with basic info (name, status, uptime, cpu, memory, etc.)
        """
        try:
            return proxmox.nodes.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get nodes: {str(e)}")
            raise Exception("Failed to get nodes")

    @staticmethod
    async def get_node_status(proxmox: ProxmoxAPI, node: str) -> Dict[str, Any]:
        """
        Get current status of a specific node

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            Dict with node status (uptime, cpu, memory, swap, etc.)
        """
        try:
            return proxmox.nodes(node).status.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get node status for {node}: {str(e)}")
            raise Exception("Failed to get node status")

    @staticmethod
    async def get_node_version(proxmox: ProxmoxAPI, node: str) -> Dict[str, Any]:
        """
        Get node version information

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            Dict with version info (pve-manager, kernel, etc.)
        """
        try:
            return proxmox.nodes(node).version.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get node version for {node}: {str(e)}")
            raise Exception("Failed to get node version")

    @staticmethod
    async def get_node_time(proxmox: ProxmoxAPI, node: str) -> Dict[str, Any]:
        """
        Get node time and timezone

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            Dict with time info (localtime, timezone)
        """
        try:
            return proxmox.nodes(node).time.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get node time for {node}: {str(e)}")
            raise Exception("Failed to get node time")

    @staticmethod
    async def update_node_time(
        proxmox: ProxmoxAPI,
        node: str,
        timezone: str,
    ) -> Dict[str, Any]:
        """
        Update node timezone

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            timezone (Optional[str]): Timezone (e.g., 'Asia/Ho_Chi_Minh', 'UTC')

        Returns:
            Success status
        """
        try:
            task = proxmox.nodes(node).time.put(timezone=timezone)
            return {
                "success": True,
                "task": task,
                "message": f"Timezone updated for node {node}",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to update node time for {node}: {str(e)}")
            raise Exception("Failed to update node time")

    @staticmethod
    async def get_node_subscription(proxmox: ProxmoxAPI, node: str) -> Dict[str, Any]:
        """
        Get node subscription information

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            Dict with subscription info (status, level, key, etc.)
        """
        try:
            return proxmox.nodes(node).subscription.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get node subscription for {node}: {str(e)}")
            raise Exception("Failed to get node subscription")

    @staticmethod
    async def get_node_rrd_data(
        proxmox: ProxmoxAPI,
        node: str,
        timeframe: str = "hour",
        cf: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get node RRD (Round Robin Database) statistics

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            timeframe (str): Time frame ('hour', 'day', 'week', 'month', 'year', 'decade')
            cf (Optional[str]): Consolidation function ('AVERAGE', 'MAX')

        Returns:
            List of RRD data points
        """
        try:
            params = {"timeframe": timeframe}
            if cf:
                params["cf"] = cf

            return proxmox.nodes(node).rrddata.get(**params)
        except ResourceException as e:
            logger.error(f">>> Failed to get node RRD data for {node}: {str(e)}")
            raise Exception("Failed to get node RRD data")

    @staticmethod
    async def get_node_report(proxmox: ProxmoxAPI, node: str) -> str:
        """
        Get node system report

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            System report as string
        """
        try:
            return proxmox.nodes(node).report.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get node report for {node}: {str(e)}")
            raise Exception("Failed to get node report")

    @staticmethod
    async def get_node_network(proxmox: ProxmoxAPI, node: str) -> List[Dict[str, Any]]:
        """
        Get node network configuration

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            List of network interfaces
        """
        try:
            return proxmox.nodes(node).network.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get node network for {node}: {str(e)}")
            raise Exception("Failed to get node network")

    @staticmethod
    async def get_node_network_interface(
        proxmox: ProxmoxAPI,
        node: str,
        iface: str,
    ) -> Dict[str, Any]:
        """
        Get specific network interface configuration

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            iface (str): Interface name (e.g., 'vmbr0', 'eth0')

        Returns:
            Interface configuration
        """
        try:
            return proxmox.nodes(node).network(iface).get()
        except ResourceException as e:
            logger.error(
                f">>> Failed to get interface {iface} for node {node}: {str(e)}"
            )
            raise Exception("Failed to get interface")

    @staticmethod
    async def create_network_interface(
        proxmox: ProxmoxAPI,
        node: str,
        iface: str,
        type: str,
        address: Optional[str] = None,
        netmask: Optional[str] = None,
        gateway: Optional[str] = None,
        bridge_ports: Optional[str] = None,
        autostart: bool = True,
        comments: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Create network interface

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            iface (str): Interface name
            type (str): Interface type ('bridge', 'bond', 'eth', 'vlan', 'OVSBridge', etc.)
            address (Optional[str]): IP address
            netmask (Optional[str]): Network mask
            gateway (Optional[str]): Gateway IP
            bridge_ports (Optional[str]): Bridge ports (space-separated)
            autostart (bool): Start on boot
            comments (Optional[str]): Interface description
            **kwargs: Additional interface parameters

        Returns:
            Success status
        """
        try:
            params = {
                "iface": iface,
                "type": type,
            }
            if address:
                params["address"] = address
            if netmask:
                params["netmask"] = netmask
            if gateway:
                params["gateway"] = gateway
            if bridge_ports:
                params["bridge_ports"] = bridge_ports
            if not autostart:
                params["autostart"] = 0
            if comments:
                params["comments"] = comments
            params.update(kwargs)

            task = proxmox.nodes(node).network.post(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Interface {iface} created on {node}",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to create interface {iface} on {node}: {str(e)}")
            raise Exception("Failed to create interface")

    @staticmethod
    async def update_network_interface(
        proxmox: ProxmoxAPI,
        node: str,
        iface: str,
        type: str,
        address: Optional[str] = None,
        netmask: Optional[str] = None,
        gateway: Optional[str] = None,
        bridge_ports: Optional[str] = None,
        autostart: bool = True,
        comments: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Update network interface configuration

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            iface (str): Interface name
            type (str): Interface type ('bridge', 'bond', 'eth', 'vlan', 'OVSBridge', etc.)
            address (Optional[str]): IP address
            netmask (Optional[str]): Network mask
            gateway (Optional[str]): Gateway IP
            bridge_ports (Optional[str]): Bridge ports (space-separated)
            autostart (bool): Start on boot
            comments (Optional[str]): Interface description
            **kwargs: Interface parameters to update

        Returns:
            Success status
        """
        try:
            params = {
                "iface": iface,
                "type": type,
            }
            if address:
                params["address"] = address
            if netmask:
                params["netmask"] = netmask
            if gateway:
                params["gateway"] = gateway
            if bridge_ports:
                params["bridge_ports"] = bridge_ports
            if not autostart:
                params["autostart"] = 0
            if comments:
                params["comments"] = comments
            params.update(kwargs)

            task = proxmox.nodes(node).network(iface).put(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Interface {iface} updated on {node}",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to update interface {iface} on {node}: {str(e)}")
            raise Exception("Failed to update interface")

    @staticmethod
    async def delete_network_interface(
        proxmox: ProxmoxAPI,
        node: str,
        iface: str,
    ) -> Dict[str, Any]:
        """
        Delete network interface

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            iface (str): Interface name

        Returns:
            Success status
        """
        try:
            task = proxmox.nodes(node).network(iface).delete()
            return {
                "success": True,
                "task": task,
                "message": f"Interface {iface} deleted from {node}",
            }
        except ResourceException as e:
            logger.error(
                f">>> Failed to delete interface {iface} from {node}: {str(e)}"
            )
            raise Exception("Failed to delete interface")

    @staticmethod
    async def apply_network_changes(proxmox: ProxmoxAPI, node: str) -> Dict[str, Any]:
        """
        Apply pending network configuration changes (requires reboot)

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            Success status
        """
        try:
            task = proxmox.nodes(node).network.put()
            return {
                "success": True,
                "task": task,
                "message": f"Network changes applied for {node} (reboot required)",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to apply network changes for {node}: {str(e)}")
            raise Exception("Failed to apply network changes")

    @staticmethod
    async def revert_network_changes(proxmox: ProxmoxAPI, node: str) -> Dict[str, Any]:
        """
        Revert pending network configuration changes

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            Success status
        """
        try:
            task = proxmox.nodes(node).network.delete()
            return {
                "success": True,
                "task": task,
                "message": f"Network changes reverted for {node}",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to revert network changes for {node}: {str(e)}")
            raise Exception("Failed to revert network changes")

    @staticmethod
    async def get_node_disks(proxmox: ProxmoxAPI, node: str) -> List[Dict[str, Any]]:
        """
        Get list of physical disks on node

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            List of disks with details (devpath, size, model, serial, etc.)
        """
        try:
            return proxmox.nodes(node).disks.list.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get disks for node {node}: {str(e)}")
            raise Exception("Failed to get disks")

    @staticmethod
    async def get_node_disk_smart(
        proxmox: ProxmoxAPI,
        node: str,
        disk: str,
    ) -> Dict[str, Any]:
        """
        Get S.M.A.R.T. health info for a disk

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            disk (str): Disk device path (e.g., '/dev/sda')

        Returns:
            S.M.A.R.T. data
        """
        try:
            return proxmox.nodes(node).disks.smart.get(disk=disk)
        except ResourceException as e:
            logger.error(
                f">>> Failed to get S.M.A.R.T. data for {disk} on {node}: {str(e)}"
            )
            raise Exception("Failed to get S.M.A.R.T. data")

    @staticmethod
    async def get_node_lvm(proxmox: ProxmoxAPI, node: str) -> List[Dict[str, Any]]:
        """
        Get LVM volume groups on node

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            List of LVM volume groups
        """
        try:
            return proxmox.nodes(node).disks.lvm.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get LVM for node {node}: {str(e)}")
            raise

    @staticmethod
    async def create_lvm(
        proxmox: ProxmoxAPI,
        node: str,
        device: str,
        name: str,
        add_storage: bool = False,
    ) -> Dict[str, Any]:
        """
        Create LVM volume group

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            device (str): Block device name (e.g., '/dev/sdb')
            name (str): Volume group name
            add_storage (bool): Add as Proxmox storage

        Returns:
            Success status
        """
        try:
            params = {
                "device": device,
                "name": name,
            }
            if add_storage:
                params["add_storage"] = 1

            task = proxmox.nodes(node).disks.lvm.post(**params)
            return {
                "success": True,
                "task": task,
                "message": f"LVM {name} created on {node}",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to create LVM {name} on {node}: {str(e)}")
            raise Exception("Failed to create LVM")

    @staticmethod
    async def get_node_lvmthin(proxmox: ProxmoxAPI, node: str) -> List[Dict[str, Any]]:
        """
        Get LVM-thin pools on node

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            List of LVM-thin pools
        """
        try:
            return proxmox.nodes(node).disks.lvmthin.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get LVM-thin for node {node}: {str(e)}")
            raise Exception("Failed to get LVM-thin")

    @staticmethod
    async def create_lvmthin(
        proxmox: ProxmoxAPI,
        node: str,
        device: str,
        name: str,
        add_storage: bool = False,
    ) -> Dict[str, Any]:
        """
        Create LVM-thin pool

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            device (str): Block device name
            name (str): Pool name
            add_storage (bool): Add as Proxmox storage

        Returns:
            Success status
        """
        try:
            params = {
                "device": device,
                "name": name,
            }
            if add_storage:
                params["add_storage"] = 1

            task = proxmox.nodes(node).disks.lvmthin.post(**params)
            return {
                "success": True,
                "task": task,
                "message": f"LVM-thin {name} created on {node}",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to create LVM-thin {name} on {node}: {str(e)}")
            raise Exception("Failed to create LVM-thin")

    @staticmethod
    async def get_node_zfs(proxmox: ProxmoxAPI, node: str) -> List[Dict[str, Any]]:
        """
        Get ZFS pools on node

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            List of ZFS pools
        """
        try:
            return proxmox.nodes(node).disks.zfs.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get ZFS for node {node}: {str(e)}")
            raise Exception("Failed to get ZFS")

    @staticmethod
    async def create_zfs(
        proxmox: ProxmoxAPI,
        node: str,
        devices: str,
        name: str,
        raidlevel: str,
        add_storage: bool = True,
        compression: Optional[str] = None,
        ashift: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Create ZFS pool

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            devices (str): Block devices (comma-separated)
            name (str): Pool name
            raidlevel (str): RAID level ('single', 'mirror', 'raid10', 'raidz', 'raidz2', 'raidz3')
            add_storage (bool): Add as Proxmox storage
            compression (Optional[str]): Compression algorithm ('on', 'off', 'lzjb', 'lz4', 'zle', 'gzip')
            ashift (Optional[int]): Pool sector size exponent

        Returns:
            Success status
        """
        try:
            params = {
                "devices": devices,
                "name": name,
                "raidlevel": raidlevel,
            }
            if add_storage:
                params["add_storage"] = 1
            if compression:
                params["compression"] = compression
            if ashift:
                params["ashift"] = ashift

            task = proxmox.nodes(node).disks.zfs.post(**params)
            return {
                "success": True,
                "task": task,
                "message": f"ZFS pool {name} created on {node}",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to create ZFS pool {name} on {node}: {str(e)}")
            raise Exception("Failed to create ZFS pool")

    @staticmethod
    async def get_node_certificates(
        proxmox: ProxmoxAPI, node: str
    ) -> List[Dict[str, Any]]:
        """
        Get node SSL certificates

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            List of certificates
        """
        try:
            return proxmox.nodes(node).certificates.info.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get certificates for node {node}: {str(e)}")
            raise Exception("Failed to get certificates")

    @staticmethod
    async def get_node_services(proxmox: ProxmoxAPI, node: str) -> List[Dict[str, Any]]:
        """
        Get node system services

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            List of services with status
        """
        try:
            return proxmox.nodes(node).services.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get services for node {node}: {str(e)}")
            raise Exception("Failed to get services")

    @staticmethod
    async def get_node_service_state(
        proxmox: ProxmoxAPI,
        node: str,
        service: str,
    ) -> Dict[str, Any]:
        """
        Get specific service state

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            service (str): Service name (e.g., 'pvedaemon', 'pveproxy')

        Returns:
            Service state
        """
        try:
            return proxmox.nodes(node).services(service).state.get()
        except ResourceException as e:
            logger.error(
                f">>> Failed to get state for service {service} on {node}: {str(e)}"
            )
            raise Exception("Failed to get service state")

    @staticmethod
    async def control_node_service(
        proxmox: ProxmoxAPI,
        node: str,
        service: str,
        action: str,
    ) -> Dict[str, Any]:
        """
        Control node service (start, stop, restart, reload)

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            service (str): Service name
            action (str): Action ('start', 'stop', 'restart', 'reload')

        Returns:
            Success status
        """
        try:
            task = None

            if action == "start":
                task = proxmox.nodes(node).services(service).start.post()
            elif action == "stop":
                task = proxmox.nodes(node).services(service).stop.post()
            elif action == "restart":
                task = proxmox.nodes(node).services(service).restart.post()
            elif action == "reload":
                task = proxmox.nodes(node).services(service).reload.post()

            return {
                "success": True,
                "task": task,
                "message": f"Service {service} {action}ed on {node}",
            }
        except ResourceException as e:
            logger.error(
                f">>> Failed to {action} service {service} on {node}: {str(e)}"
            )
            raise Exception("Failed to action service")

    @staticmethod
    async def reboot_node(proxmox: ProxmoxAPI, node: str) -> Dict[str, Any]:
        """
        Reboot a node

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            Success status
        """
        try:
            task = proxmox.nodes(node).status.post(command="reboot")
            return {
                "success": True,
                "task": task,
                "message": f"Node {node} reboot initiated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to reboot node {node}: {str(e)}")
            raise Exception("Failed to reboot node")

    @staticmethod
    async def shutdown_node(proxmox: ProxmoxAPI, node: str) -> Dict[str, Any]:
        """
        Shutdown a node

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            Success status
        """
        try:
            task = proxmox.nodes(node).status.post(command="shutdown")
            return {
                "success": True,
                "task": task,
                "message": f"Node {node} shutdown initiated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to shutdown node {node}: {str(e)}")
            raise Exception("Failed to shutdown node")

    @staticmethod
    async def get_node_tasks(
        proxmox: ProxmoxAPI,
        node: str,
        errors: Optional[bool] = None,
        limit: Optional[int] = None,
        source: Optional[str] = None,
        start: Optional[int] = None,
        typefilter: Optional[str] = None,
        userfilter: Optional[str] = None,
        vmid: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get tasks for a specific node

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            errors (Optional[bool]): Only show errors
            limit (Optional[int]): Maximum number of tasks
            source (Optional[str]): Filter by source
            start (Optional[int]): Start from task ID
            typefilter (Optional[str]): Filter by task type
            userfilter (Optional[str]): Filter by user
            vmid (Optional[int]): Filter by VM ID

        Returns:
            List of tasks
        """
        try:
            params = {}
            if errors is not None:
                params["errors"] = 1 if errors else 0
            if limit:
                params["limit"] = limit
            if source:
                params["source"] = source
            if start:
                params["start"] = start
            if typefilter:
                params["typefilter"] = typefilter
            if userfilter:
                params["userfilter"] = userfilter
            if vmid:
                params["vmid"] = vmid

            return proxmox.nodes(node).tasks.get(**params)
        except ResourceException as e:
            logger.error(f">>> Failed to get tasks for node {node}: {str(e)}")
            raise Exception("Failed to get tasks for node")

    @staticmethod
    async def get_node_syslog(
        proxmox: ProxmoxAPI,
        node: str,
        limit: Optional[int] = None,
        since: Optional[str] = None,
        until: Optional[str] = None,
        service: Optional[str] = None,
        start: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get node system log

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            limit (Optional[int]): Maximum number of lines
            since (Optional[str]): Display since this time
            until (Optional[str]): Display until this time
            service (Optional[str]): Filter by service
            start (Optional[int]): Start from log ID

        Returns:
            System log entries
        """
        try:
            params = {}
            if limit:
                params["limit"] = limit
            if since:
                params["since"] = since
            if until:
                params["until"] = until
            if service:
                params["service"] = service
            if start:
                params["start"] = start

            return proxmox.nodes(node).syslog.get(**params)
        except ResourceException as e:
            logger.error(f">>> Failed to get syslog for node {node}: {str(e)}")
            raise Exception("Failed to get syslog for node")


class ProxmoxStorageService:
    """Service for managing Proxmox storage operations"""

    @staticmethod
    async def get_storages(proxmox: ProxmoxAPI) -> List[Dict[str, Any]]:
        """
        Get list of all storages in the cluster

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            List of storages with type, content, status, etc.
        """
        try:
            return proxmox.storage.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get storages: {str(e)}")
            raise Exception("Failed to get storages")

    @staticmethod
    async def get_storage_config(proxmox: ProxmoxAPI, storage: str) -> Dict[str, Any]:
        """
        Get storage configuration

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            storage (str): Storage ID

        Returns:
            Storage configuration details
        """
        try:
            return proxmox.storage(storage).get()
        except ResourceException as e:
            logger.error(f">>> Failed to get config for storage {storage}: {str(e)}")
            raise Exception("Failed to get storage config")

    @staticmethod
    async def create_storage(
        proxmox: ProxmoxAPI,
        storage: str,
        type: str,
        content: Optional[str] = None,
        nodes: Optional[str] = None,
        disable: bool = False,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Create new storage

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            storage (str): Storage ID
            type (str): Storage type ('dir', 'lvm', 'lvmthin', 'nfs', 'cifs', 'glusterfs',
                        'iscsi', 'iscsidirect', 'cephfs', 'rbd', 'zfs', 'zfspool', etc.)
            content (Optional[str]): Content types (comma-separated: 'images', 'rootdir',
                                     'vztmpl', 'backup', 'iso', 'snippets')
            nodes (Optional[str]): Node restriction (comma-separated node names)
            disable (bool): Disable storage
            **kwargs: Storage type-specific parameters (path, server, export, pool, etc.)

        Returns:
            Success status

        Examples:
            # Directory storage
            create_storage(proxmox, 'local-dir', 'dir', path='/mnt/local',
                          content='images,rootdir')

            # NFS storage
            create_storage(proxmox, 'nfs-backup', 'nfs', server='192.168.1.100',
                          export='/backup', content='backup,iso')

            # LVM-thin storage
            create_storage(proxmox, 'lvm-thin', 'lvmthin', vgname='pve',
                          thinpool='data', content='images,rootdir')
        """
        try:
            params = {
                "storage": storage,
                "type": type,
            }
            if content:
                params["content"] = content
            if nodes:
                params["nodes"] = nodes
            if disable:
                params["disable"] = 1
            params.update(kwargs)

            task = proxmox.storage.post(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Storage {storage} created",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to create storage {storage}: {str(e)}")
            raise Exception("Failed to create storage")

    @staticmethod
    async def update_storage(
        proxmox: ProxmoxAPI,
        storage: str,
        content: Optional[str] = None,
        nodes: Optional[str] = None,
        disable: bool = False,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Update storage configuration

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            storage (str): Storage ID
            content (Optional[str]): Content types (comma-separated)
            nodes (Optional[str]): Node restriction (comma-separated node names)
            disable (bool): Disable storage
            **kwargs: Storage parameters to update

        Returns:
            Success status
        """
        try:
            params = {}
            if content:
                params["content"] = content
            if nodes:
                params["nodes"] = nodes
            if disable:
                params["disable"] = 1
            params.update(kwargs)

            task = proxmox.storage(storage).put(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Storage {storage} updated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to update storage {storage}: {str(e)}")
            raise Exception("Failed to update storage")

    @staticmethod
    async def delete_storage(proxmox: ProxmoxAPI, storage: str) -> Dict[str, Any]:
        """
        Delete storage

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            storage (str): Storage ID

        Returns:
            Success status
        """
        try:
            task = proxmox.storage(storage).delete()
            return {
                "success": True,
                "task": task,
                "message": f"Storage {storage} deleted",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to delete storage {storage}: {str(e)}")
            raise Exception("Failed to delete storage")

    @staticmethod
    async def get_node_storage_status(
        proxmox: ProxmoxAPI,
        node: str,
        storage: Optional[str] = None,
        content: Optional[str] = None,
        enabled: bool = False,
        format: bool = False,
        target: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get storage status on a specific node

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            storage (Optional[str]): Filter by storage ID
            content (Optional[str]): Filter by content type
            enabled (bool): Only show enabled storages
            format (bool): Format output
            target (Optional[str]): Target type

        Returns:
            List of storage status on node
        """
        try:
            params = {}
            if storage:
                params["storage"] = storage
            if content:
                params["content"] = content
            if enabled:
                params["enabled"] = 1
            if format:
                params["format"] = 1
            if target:
                params["target"] = target

            return proxmox.nodes(node).storage.get(**params)
        except ResourceException as e:
            logger.error(f">>> Failed to get storage status for node {node}: {str(e)}")
            raise Exception("Failed to get node storage status")

    @staticmethod
    async def get_storage_content(
        proxmox: ProxmoxAPI,
        node: str,
        storage: str,
        content: Optional[str] = None,
        vmid: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get storage content (images, ISOs, backups, etc.)

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            storage (str): Storage ID
            content (Optional[str]): Filter by content type
            vmid (Optional[int]): Filter by VM ID

        Returns:
            List of content items
        """
        try:
            params = {}
            if content:
                params["content"] = content
            if vmid:
                params["vmid"] = vmid

            return proxmox.nodes(node).storage(storage).content.get(**params)
        except ResourceException as e:
            logger.error(f">>> Failed to get content for storage {storage}: {str(e)}")
            raise Exception("Failed to get storage content")

    @staticmethod
    async def allocate_disk_image(
        proxmox: ProxmoxAPI,
        node: str,
        storage: str,
        filename: str,
        size: str,
        vmid: int,
        format: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Allocate disk image on storage

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            storage (str): Storage ID
            filename (str): Filename for disk image
            size (str): Size (e.g., '32G', '100M')
            vmid (int): VM ID
            format (Optional[str]): Format ('raw', 'qcow2', 'vmdk', 'subvol')

        Returns:
            Success status with volume ID
        """
        try:
            params = {
                "filename": filename,
                "size": size,
                "vmid": vmid,
            }
            if format:
                params["format"] = format

            task = proxmox.nodes(node).storage(storage).content.post(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Disk image allocated on {storage}",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to allocate disk on {storage}: {str(e)}")
            raise Exception("Failed to allocate disk image")

    @staticmethod
    async def upload_file_to_storage(
        proxmox: ProxmoxAPI,
        node: str,
        storage: str,
        content: str,
        filename: str,
        file_data: bytes,
    ) -> Dict[str, Any]:
        """
        Upload file to storage (ISO, template, etc.)

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            storage (str): Storage ID
            content (str): Content type ('iso', 'vztmpl')
            filename (str): Target filename
            file_data (bytes): File data

        Returns:
            Success status
        """
        try:
            task = (
                proxmox.nodes(node)
                .storage(storage)
                .upload.post(
                    content=content,
                    filename=filename,
                    tmpfilename=file_data,
                )
            )
            return {
                "success": True,
                "task": task,
                "message": f"File {filename} uploaded to {storage}",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to upload file to {storage}: {str(e)}")
            raise Exception("Failed to upload file to storage")

    @staticmethod
    async def get_volume_info(
        proxmox: ProxmoxAPI,
        node: str,
        storage: str,
        volume: str,
    ) -> Dict[str, Any]:
        """
        Get volume information

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            storage (str): Storage ID
            volume (str): Volume ID

        Returns:
            Volume information
        """
        try:
            return proxmox.nodes(node).storage(storage).content(volume).get()
        except ResourceException as e:
            logger.error(f">>> Failed to get volume info for {volume}: {str(e)}")
            raise Exception("Failed to get volume information")

    @staticmethod
    async def update_volume_attributes(
        proxmox: ProxmoxAPI,
        node: str,
        storage: str,
        volume: str,
        notes: Optional[str] = None,
        protected: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """
        Update volume attributes

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            storage (str): Storage ID
            volume (str): Volume ID
            notes (Optional[str]): Volume notes/description
            protected (Optional[bool]): Protection flag

        Returns:
            Success status
        """
        try:
            params = {}
            if notes is not None:
                params["notes"] = notes
            if protected is not None:
                params["protected"] = 1 if protected else 0

            task = proxmox.nodes(node).storage(storage).content(volume).put(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Volume {volume} updated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to update volume {volume}: {str(e)}")
            raise Exception("Failed to update volume")

    @staticmethod
    async def delete_volume(
        proxmox: ProxmoxAPI,
        node: str,
        storage: str,
        volume: str,
        delay: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Delete volume from storage

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            storage (str): Storage ID
            volume (str): Volume ID (e.g., 'local:100/vm-100-disk-0.qcow2')
            delay (Optional[int]): Delay in seconds

        Returns:
            Success status
        """
        try:
            params = {}
            if delay:
                params["delay"] = delay

            task = proxmox.nodes(node).storage(storage).content(volume).delete(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Volume {volume} deleted",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to delete volume {volume}: {str(e)}")
            raise Exception("Failed to delete volume")

    @staticmethod
    async def get_storage_rrd_data(
        proxmox: ProxmoxAPI,
        node: str,
        storage: str,
        timeframe: str = "hour",
        cf: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get storage RRD statistics

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            storage (str): Storage ID
            timeframe (str): Time frame ('hour', 'day', 'week', 'month', 'year')
            cf (Optional[str]): Consolidation function ('AVERAGE', 'MAX')

        Returns:
            List of RRD data points
        """
        try:
            params = {"timeframe": timeframe}
            if cf:
                params["cf"] = cf

            return proxmox.nodes(node).storage(storage).rrddata.get(**params)
        except ResourceException as e:
            logger.error(f">>> Failed to get RRD data for storage {storage}: {str(e)}")
            raise Exception("Failed to get RRD data for storage")

    @staticmethod
    async def prune_backups(
        proxmox: ProxmoxAPI,
        node: str,
        storage: str,
        type: str = "backup",
        vmid: Optional[int] = None,
        prune_backups: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Prune old backups based on retention policy

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            storage (str): Storage ID
            type (str): Backup type
            vmid (Optional[int]): VM ID to prune backups for
            prune_backups (Optional[str]): Retention policy (e.g., 'keep-last=3,keep-weekly=2')

        Returns:
            Success status
        """
        try:
            params = {"type": type}
            if vmid:
                params["vmid"] = vmid
            if prune_backups:
                params["prune-backups"] = prune_backups

            task = proxmox.nodes(node).storage(storage).prunebackups.delete(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Backups pruned on {storage}",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to prune backups on {storage}: {str(e)}")
            raise Exception("Failed to prune backups")


class ProxmoxPoolService:
    """Service for managing Proxmox resource pools"""

    @staticmethod
    async def get_pools(proxmox: ProxmoxAPI) -> List[Dict[str, Any]]:
        """
        Get list of all resource pools

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance

        Returns:
            List of pools with members count
        """
        try:
            return proxmox.pools.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get pools: {str(e)}")
            raise Exception("Failed to get pools")

    @staticmethod
    async def get_pool(proxmox: ProxmoxAPI, poolid: str) -> Dict[str, Any]:
        """
        Get specific pool details including members

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            poolid (str): Pool ID

        Returns:
            Pool details with list of members (VMs, storage)
        """
        try:
            return proxmox.pools(poolid).get()
        except ResourceException as e:
            logger.error(f">>> Failed to get pool {poolid}: {str(e)}")
            raise Exception("Failed to get pool")

    @staticmethod
    async def create_pool(
        proxmox: ProxmoxAPI,
        poolid: str,
        comment: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create new resource pool

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            poolid (str): Pool ID (unique identifier)
            comment (Optional[str]): Pool description

        Returns:
            Success status
        """
        try:
            params = {"poolid": poolid}
            if comment:
                params["comment"] = comment

            task = proxmox.pools.post(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Pool {poolid} created",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to create pool {poolid}: {str(e)}")
            raise Exception("Failed to create pool")

    @staticmethod
    async def update_pool(
        proxmox: ProxmoxAPI,
        poolid: str,
        comment: Optional[str] = None,
        delete: Optional[bool] = None,
        storage: Optional[str] = None,
        vms: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Update pool configuration or members

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            poolid (str): Pool ID
            comment (Optional[str]): New comment
            delete (Optional[bool]): Delete mode (remove members)
            storage (Optional[str]): Storage IDs to add/remove (comma-separated)
            vms (Optional[str]): VM IDs to add/remove (comma-separated)

        Returns:
            Success status

        Examples:
            # Update comment
            update_pool(proxmox, 'prod', comment='Production VMs')

            # Add VMs to pool
            update_pool(proxmox, 'prod', vms='100,101,102')

            # Remove VMs from pool
            update_pool(proxmox, 'prod', vms='100,101', delete=True)
        """
        try:
            params = {}
            if comment:
                params["comment"] = comment
            if delete:
                params["delete"] = 1
            if storage:
                params["storage"] = storage
            if vms:
                params["vms"] = vms

            task = proxmox.pools(poolid).put(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Pool {poolid} updated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to update pool {poolid}: {str(e)}")
            raise Exception("Failed to update pool")

    @staticmethod
    async def delete_pool(proxmox: ProxmoxAPI, poolid: str) -> Dict[str, Any]:
        """
        Delete resource pool

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            poolid (str): Pool ID

        Returns:
            Success status

        Note:
            Pool must be empty before deletion
        """
        try:
            task = proxmox.pools(poolid).delete()
            return {
                "success": True,
                "task": task,
                "message": f"Pool {poolid} deleted",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to delete pool {poolid}: {str(e)}")
            raise Exception("Failed to delete pool")


class ProxmoxTemplateService:
    """Service for managing Proxmox template operations"""

    @staticmethod
    async def get_templates(proxmox: ProxmoxAPI, node: str) -> List[Dict[str, Any]]:
        """
        Get list of all templates on a node

        Args:
            proxmox: ProxmoxAPI instance
            node: Node name

        Returns:
            List of template dictionaries with vmid, name, status, etc.
        """
        try:
            return proxmox.nodes(node).qemu.get(template=1)
        except ResourceException as e:
            logger.error(f">>> Failed to get templates for node {node}: {str(e)}")
            raise Exception("Failed to get templates")

    @staticmethod
    async def get_all_templates(proxmox: ProxmoxAPI) -> List[Dict[str, Any]]:
        """
        Get all templates across all nodes in the cluster

        Args:
            proxmox: ProxmoxAPI instance

        Returns:
            List of templates with node information
        """
        try:
            templates = []
            nodes = proxmox.nodes.get()
            for node in nodes:
                node_name = node["node"]
                node_templates = proxmox.nodes(node_name).qemu.get(template=1)
                for template in node_templates:
                    template["node"] = node_name
                    templates.append(template)
            return templates
        except ResourceException as e:
            logger.error(f">>> Failed to get all templates: {str(e)}")
            raise Exception("Failed to get all templates")

    @staticmethod
    async def create_template_from_vm(
        proxmox: ProxmoxAPI,
        node: str,
        vmid: int,
    ) -> Dict[str, Any]:
        """
        Convert an existing VM to a template

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID to convert to template

        Returns:
            Success status and message
        """
        try:
            task = proxmox.nodes(node).qemu(vmid).template.post()
            return {
                "success": True,
                "task": task,
                "message": f"VM {vmid} converted to template",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to create template from VM {vmid}: {str(e)}")
            raise Exception("Failed to create template from VM")

    @staticmethod
    async def delete_template(
        proxmox: ProxmoxAPI,
        node: str,
        vmid: int,
        purge: bool = False,
    ) -> Dict[str, Any]:
        """
        Delete a template

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): Template VM ID
            purge (bool, optional): Purge template (remove from all pools and delete all snapshots). Defaults to False.

        Returns:
            Task ID and success status
        """
        try:
            params = {}
            if purge:
                params["purge"] = 1

            task = proxmox.nodes(node).qemu(vmid).delete(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Template {vmid} deletion initiated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to delete template {vmid}: {str(e)}")
            raise Exception("Failed to delete template")

    @staticmethod
    async def update_template_config(
        proxmox: ProxmoxAPI,
        node: str,
        vmid: int,
        **config,
    ) -> Dict[str, Any]:
        """
        Update configuration of a template

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): Template VM ID
            **config: Configuration parameters to update

        Returns:
            Success status and result

        Examples of config parameters:
            - name: New name for the template
            - description: New description
            - memory: Memory size in MB
            - cores: Number of CPU cores
            - etc.
        """
        try:
            task = proxmox.nodes(node).qemu(vmid).config.put(**config)
            return {
                "success": True,
                "task": task,
                "message": f"Template {vmid} config updated",
            }
        except ResourceException as e:
            logger.error(f"Failed to update template {vmid} config: {str(e)}")
            raise Exception("Failed to update template config")

    @staticmethod
    async def move_template_disk(
        proxmox: ProxmoxAPI,
        node: str,
        vmid: int,
        disk: str,
        storage: str,
        delete_source: bool = True,
    ) -> Dict[str, Any]:
        """
        Move a template's disk to a different storage

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): Template VM ID
            disk (str): Disk identifier (e.g., 'scsi0', 'ide0')
            storage (str): Target storage name
            delete_source (bool, optional): Delete source disk after move. Defaults to True.

        Returns:
            Task ID and success status
        """
        try:
            params = {
                "disk": disk,
                "storage": storage,
                "delete": 1 if delete_source else 0,
            }

            task = proxmox.nodes(node).qemu(vmid).move_disk.post(**params)
            return {
                "success": True,
                "task": task,
                "message": f"Disk {disk} move initiated",
            }
        except ResourceException as e:
            logger.error(f"Failed to move disk {disk} for template {vmid}: {str(e)}")
            raise Exception("Failed to move template disk")

    @staticmethod
    async def check_template_exists(proxmox: ProxmoxAPI, node: str, vmid: int) -> bool:
        """
        Check if a VM is a template

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            True if VM is a template, False otherwise
        """
        try:
            config = proxmox.nodes(node).qemu(vmid).config.get()
            return config.get("template", 0) == 1
        except ResourceException:
            return False


class ProxmoxVMService:
    """Service for managing Proxmox VM operations"""

    @staticmethod
    async def get_vms(proxmox: ProxmoxAPI, node: str) -> List[Dict[str, Any]]:
        """
        Get list of all VMs on a node

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name

        Returns:
            List of VM dictionaries with vmid, name, status, etc.
        """
        try:
            return proxmox.nodes(node).qemu.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get VMs for node {node}: {str(e)}")
            raise Exception("Failed to get VMs")

    @staticmethod
    async def get_vm_config(
        proxmox: ProxmoxAPI, node: str, vmid: int
    ) -> Dict[str, Any]:
        """
        Get VM configuration

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            Dict with VM configuration (CPU, memory, disks, network, etc.)
        """
        try:
            return proxmox.nodes(node).qemu(vmid).config.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get VM config for {vmid}: {str(e)}")
            raise Exception("Failed to get VM config")

    @staticmethod
    async def update_vm_config(
        proxmox: ProxmoxAPI,
        node: str,
        vmid: int,
        **config,
    ) -> Dict[str, Any]:
        """
        Update VM configuration

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            Task ID and success status
        """
        try:
            task = (
                proxmox.nodes(node)
                .qemu(vmid)
                .config.put(node=node, vmid=vmid, **config)
            )
            return {
                "success": True,
                "task": task,
                "message": f"VM {vmid} config updated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to update VM {vmid} config: {str(e)}")
            raise Exception("Failed to update VM config")

    @staticmethod
    async def get_vm_status(
        proxmox: ProxmoxAPI, node: str, vmid: int
    ) -> Dict[str, Any]:
        """
        Get VM current status

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            Dict with VM status (running, stopped, uptime, etc.)
        """
        try:
            return proxmox.nodes(node).qemu(vmid).status.current.get()
        except ResourceException as e:
            logger.error(f">>> Failed to get VM status for {vmid}: {str(e)}")
            raise Exception("Failed to get VM status")

    @staticmethod
    async def get_vm_info(proxmox: ProxmoxAPI, node: str, vmid: int) -> Dict[str, Any]:
        """
        Get comprehensive VM information

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            Dict with VM configuration and status summary
        """
        try:
            config = proxmox.nodes(node).qemu(vmid).config.get()
            status = proxmox.nodes(node).qemu(vmid).status.current.get()

            return {
                "vmid": vmid,
                "node": node,
                "name": config.get("name"),
                "description": config.get("description"),
                "cores": config.get("cores"),
                "cpu_usage": status.get("cpu"),
                "max_cpu": status.get("cpus"),
                "memory": config.get("memory"),
                "memory_usage": status.get("mem"),
                "max_memory": status.get("maxmem"),
                "netin": status.get("netin"),
                "netout": status.get("netout"),
                "sockets": config.get("sockets"),
                "ostype": config.get("ostype"),
                "template": config.get("template", 0),
                "status": status.get("status"),
                "uptime": status.get("uptime"),
                "disk_info": {
                    k: v
                    for k, v in config.items()
                    if k.startswith(("scsi", "ide", "virtio", "sata"))
                },
                "network_info": {
                    k: v for k, v in config.items() if k.startswith("net")
                },
            }
        except ResourceException as e:
            logger.error(f">>> Failed to get VM info for {vmid}: {str(e)}")
            raise Exception("Failed to get VM info")

    @staticmethod
    async def get_vm_network(
        proxmox: ProxmoxAPI,
        node: str,
        vmid: int,
    ) -> Optional[str]:
        """
        Get VM IP address from QEMU guest agent.
        Returns None if agent is not ready or no valid IP found.

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            IP address string or None if not available
        """
        try:
            result = (
                proxmox.nodes(node).qemu(vmid).agent("network-get-interfaces").get()
            )

            interfaces = result.get("result", [])
            network_info = []
            for iface in interfaces:
                # Skip loopback interface
                if iface.get("name") in ["lo", "Loopback Pseudo-Interface 1"]:
                    continue

                ip_addresses = iface.get("ip-addresses", [])
                for ip_info in ip_addresses:
                    ip_type = ip_info.get("ip-address-type")
                    ip_addr = ip_info.get("ip-address")
                    mac_addr = iface.get("hardware-address", "")

                    # Skip loopback (127.x.x.x) and link-local/APIPA (169.254.x.x) addresses
                    if (
                        ip_type == "ipv4"
                        and ip_addr
                        and not ip_addr.startswith("127.")
                        and not ip_addr.startswith("169.254.")
                    ):
                        network_info.append(
                            {
                                "ip_address": ip_addr,
                                "mac_address": mac_addr,
                            }
                        )

            if network_info:
                return network_info

            return None
        except ResourceException as e:
            # Agent not ready or other error - return None instead of raising
            logger.debug(
                f">>> Could not get VM {vmid} IP (agent may not be ready): {str(e)}"
            )
            return None
        except Exception as e:
            logger.debug(f">>> Unexpected error getting VM {vmid} IP: {str(e)}")
            return None

    @staticmethod
    async def get_vm_disk_usage(
        proxmox: ProxmoxAPI,
        node: str,
        vmid: int,
    ) -> Dict[str, Any]:
        """
        Get VM disk usage statistics

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            Dict with disk usage statistics
        """
        try:
            return proxmox.nodes(node).qemu(vmid).agent("get-fsinfo").get()
        except ResourceException as e:
            logger.error(f">>> Failed to get disk usage for VM {vmid}: {str(e)}")
            raise Exception("Failed to get VM disk usage")

    @staticmethod
    async def get_rrddata(
        proxmox: ProxmoxAPI,
        node: str,
        vmid: int,
        timeframe: str = "hour",
        cf: Optional[str] = "AVERAGE",
    ) -> List[Dict[str, Any]]:
        """
        Get VM RRD statistics

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID
            timeframe (str): Time frame ('hour', 'day', 'week', 'month', 'year')
            cf (Optional[str]): Consolidation function ('AVERAGE', 'MAX')

        Returns:
            List of RRD data points
        """
        try:
            params = {"timeframe": timeframe, "cf": cf}

            return (
                proxmox.nodes(node)
                .qemu(vmid)
                .rrddata.get(node=node, vmid=vmid, **params)
            )
        except ResourceException as e:
            logger.error(f">>> Failed to get RRD data for VM {vmid}: {str(e)}")
            raise Exception("Failed to get RRD data for VM")

    @staticmethod
    async def create_vm(
        proxmox: ProxmoxAPI,
        node: str,
        vmid: int,
        template_id: int,
        name: str,
    ) -> Dict[str, Any]:
        """
        Create a new VM or clone from template

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID
            template_id (Optional[int], optional): Template VMID to clone from (optional). Defaults to None.

        Returns:
            Task ID and success status
        """
        try:
            task = (
                proxmox.nodes(node)
                .qemu(template_id)
                .clone.post(newid=vmid, node=node, vmid=template_id, name=name)
            )
            return {
                "success": True,
                "task": task,
                "message": f"VM {vmid} creation initiated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to create VM {vmid}: {str(e)}")
            raise Exception("Failed to create VM")

    @staticmethod
    async def start_vm(proxmox: ProxmoxAPI, node: str, vmid: int) -> Dict[str, Any]:
        """
        Start a VM

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            Task ID and success status
        """
        try:
            task = (
                proxmox.nodes(node).qemu(vmid).status.start.post(node=node, vmid=vmid)
            )
            return {
                "success": True,
                "task": task,
                "message": f"VM {vmid} starting",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to start VM {vmid}: {str(e)}")
            raise Exception("Failed to start VM")

    @staticmethod
    async def stop_vm(proxmox: ProxmoxAPI, node: str, vmid: int) -> Dict[str, Any]:
        """
        Stop a VM immediately (hard stop - can lead to data loss)

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            Task ID and success status
        """
        try:
            task = proxmox.nodes(node).qemu(vmid).status.stop.post(node=node, vmid=vmid)
            return {
                "success": True,
                "task": task,
                "message": f"VM {vmid} stopping",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to stop VM {vmid}: {str(e)}")
            raise Exception("Failed to stop VM")

    @staticmethod
    async def shutdown_vm(proxmox: ProxmoxAPI, node: str, vmid: int) -> Dict[str, Any]:
        """
        Gracefully shutdown a VM

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            Task ID and success status
        """
        try:
            task = (
                proxmox.nodes(node)
                .qemu(vmid)
                .status.shutdown.post(node=node, vmid=vmid)
            )
            return {
                "success": True,
                "task": task,
                "message": f"VM {vmid} shutting down",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to shutdown VM {vmid}: {str(e)}")
            raise Exception("Failed to shutdown VM")

    @staticmethod
    async def reboot_vm(proxmox: ProxmoxAPI, node: str, vmid: int) -> Dict[str, Any]:
        """
        Reboot a VM (graceful shutdown followed by start)

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            Task ID and success status
        """
        try:
            task = (
                proxmox.nodes(node).qemu(vmid).status.reboot.post(node=node, vmid=vmid)
            )
            return {
                "success": True,
                "task": task,
                "message": f"VM {vmid} rebooting",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to reboot VM {vmid}: {str(e)}")
            raise Exception("Failed to reboot VM")

    @staticmethod
    async def reset_vm(proxmox: ProxmoxAPI, node: str, vmid: int) -> Dict[str, Any]:
        """
        Reset a VM

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            Task ID and success status
        """
        try:
            task = (
                proxmox.nodes(node).qemu(vmid).status.reset.post(node=node, vmid=vmid)
            )
            return {
                "success": True,
                "task": task,
                "message": f"VM {vmid} resetting",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to reset VM {vmid}: {str(e)}")
            raise Exception("Failed to reset VM")

    @staticmethod
    async def suspend_vm(proxmox: ProxmoxAPI, node: str, vmid: int) -> Dict[str, Any]:
        """
        Suspend a VM (pause)

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            Task ID and success status
        """
        try:
            task = (
                proxmox.nodes(node).qemu(vmid).status.suspend.post(node=node, vmid=vmid)
            )
            return {
                "success": True,
                "task": task,
                "message": f"VM {vmid} suspending",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to suspend VM {vmid}: {str(e)}")
            raise Exception("Failed to suspend VM")

    @staticmethod
    async def resume_vm(proxmox: ProxmoxAPI, node: str, vmid: int) -> Dict[str, Any]:
        """
        Resume a suspended VM

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            Task ID and success status
        """
        try:
            task = (
                proxmox.nodes(node).qemu(vmid).status.resume.post(node=node, vmid=vmid)
            )
            return {
                "success": True,
                "task": task,
                "message": f"VM {vmid} resuming",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to resume VM {vmid}: {str(e)}")
            raise Exception("Failed to resume VM")

    @staticmethod
    async def delete_vm(proxmox: ProxmoxAPI, node: str, vmid: int) -> Dict[str, Any]:
        """
        Delete a VM

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            Task ID and success status
        """
        try:
            task = (
                proxmox.nodes(node)
                .qemu(vmid)
                .delete(
                    node=node,
                    vmid=vmid,
                    skiplock=1,
                    purge=1,
                    **{"destroy-unreferenced-disks": 1},
                )
            )
            return {
                "success": True,
                "task": task,
                "message": f"VM {vmid} deletion initiated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to delete VM {vmid}: {str(e)}")
            raise Exception("Failed to delete VM")

    @staticmethod
    async def resize_vm_disk(
        proxmox: ProxmoxAPI,
        node: str,
        vmid: int,
        disk: str,
        size: str,
    ) -> Dict[str, Any]:
        """
        Resize VM disk

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID
            disk (str): Disk identifier
            size (str): New size for the disk (e.g., '20G')

        Returns:
            Result of the resize operation
        """
        try:
            task = proxmox.nodes(node).qemu(vmid).resize.put(disk=disk, size=size)
            return {
                "success": True,
                "task": task,
                "message": f"Disk {disk} resized for VM {vmid}",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to resize disk for VM {vmid}: {str(e)}")
            raise Exception("Failed to resize disk for VM")

    @staticmethod
    async def get_vnc_info(proxmox: ProxmoxAPI, node: str, vmid: int) -> Dict[str, Any]:
        """
        Get VNC connection information for a VM

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            VNC connection information
        """
        try:
            vnc_data = (
                proxmox.nodes(node).qemu(vmid).vncproxy.post(node=node, vmid=vmid)
            )
            return {
                "success": True,
                "task": {
                    "port": vnc_data.get("port"),
                    "ticket": vnc_data.get("ticket"),
                    "cert": vnc_data.get("cert"),
                },
                "message": "VNC info retrieved",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to get VNC info for VM {vmid}: {str(e)}")
            raise Exception("Failed to get VNC info for VM")

    @staticmethod
    async def create_snapshot(
        proxmox: ProxmoxAPI,
        node: str,
        vmid: int,
        snapname: str,
        description: str = "",
    ) -> Dict[str, Any]:
        """
        Create a VM snapshot

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID
            snapname (str): Snapshot name
            description (str, optional): Snapshot description. Defaults to "".

        Returns:
            Result of the snapshot creation
        """
        try:
            task = (
                proxmox.nodes(node)
                .qemu(vmid)
                .snapshot.post(
                    node=node, vmid=vmid, snapname=snapname, description=description
                )
            )
            return {
                "success": True,
                "task": task,
                "message": f"Snapshot '{snapname}' creation initiated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to create snapshot for VM {vmid}: {str(e)}")
            raise Exception("Failed to create snapshot for VM")

    @staticmethod
    async def list_snapshots(
        proxmox: ProxmoxAPI, node: str, vmid: int
    ) -> List[Dict[str, Any]]:
        """
        List all snapshots for a VM

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID

        Returns:
            List of snapshots
        """
        try:
            return proxmox.nodes(node).qemu(vmid).snapshot.get(node=node, vmid=vmid)
        except ResourceException as e:
            logger.error(f">>> Failed to list snapshots for VM {vmid}: {str(e)}")
            raise Exception("Failed to list snapshots for VM")

    @staticmethod
    async def rollback_snapshot(
        proxmox: ProxmoxAPI, node: str, vmid: int, snapname: str
    ) -> Dict[str, Any]:
        """
        Rollback to a snapshot

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID
            snapname (str): Snapshot name

        Returns:
            Result of the rollback operation
        """
        try:
            task = (
                proxmox.nodes(node)
                .qemu(vmid)
                .snapshot(snapname)
                .rollback.post(node=node, vmid=vmid, snapname=snapname)
            )
            return {
                "success": True,
                "task": task,
                "message": f"Rollback to '{snapname}' initiated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to rollback snapshot for VM {vmid}: {str(e)}")
            raise Exception("Failed to rollback snapshot for VM")

    @staticmethod
    async def delete_snapshot(
        proxmox: ProxmoxAPI, node: str, vmid: int, snapname: str
    ) -> Dict[str, Any]:
        """
        Delete a VM snapshot

        Args:
            proxmox (ProxmoxAPI): ProxmoxAPI instance
            node (str): Node name
            vmid (int): VM ID
            snapname (str): Snapshot name

        Returns:
            Result of the delete operation
        """
        try:
            task = (
                proxmox.nodes(node)
                .qemu(vmid)
                .snapshot(snapname)
                .delete(node=node, vmid=vmid, snapname=snapname)
            )
            return {
                "success": True,
                "task": task,
                "message": f"Snapshot '{snapname}' deletion initiated",
            }
        except ResourceException as e:
            logger.error(f">>> Failed to delete snapshot for VM {vmid}: {str(e)}")
            raise Exception("Failed to delete snapshot for VM")
