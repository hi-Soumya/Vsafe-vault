// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ImageAccess {
    // State variables
    mapping(address => bool) public isAdmin;  // User A will be admin
    mapping(address => bool) public connectedUsers;  // Approved users by admin
    mapping(string => mapping(address => bool)) public imageAccess;  // CID => user => access status
    
    // Events
    event UserConnected(address indexed user, address indexed admin);
    event ImageShared(string indexed cid, address indexed sharedWith);
    event AccessRevoked(string indexed cid, address indexed user);
    event AccessRestored(string indexed cid, address indexed user);
    
    constructor() {
        isAdmin[msg.sender] = true;  // Deploy with User A's address
    }
    
    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Only admin can perform this action");
        _;
    }
    
    // Connect User B to User A
    function connectUser(address user) external onlyAdmin {
        connectedUsers[user] = true;
        emit UserConnected(user, msg.sender);
    }
    
    // Share image with connected user
    function shareImage(string calldata cid, address user) external onlyAdmin {
        require(connectedUsers[user], "User not connected");
        imageAccess[cid][user] = true;
        emit ImageShared(cid, user);
    }
    
    // Revoke access
    function revokeAccess(string calldata cid, address user) external onlyAdmin {
        require(imageAccess[cid][user], "Access not granted");
        imageAccess[cid][user] = false;
        emit AccessRevoked(cid, user);
    }
    
    // Restore access
    function restoreAccess(string calldata cid, address user) external onlyAdmin {
        require(connectedUsers[user], "User not connected");
        imageAccess[cid][user] = true;
        emit AccessRestored(cid, user);
    }
    
    // Check if user has access
    function hasAccess(string calldata cid, address user) external view returns (bool) {
        return imageAccess[cid][user];
    }
}
