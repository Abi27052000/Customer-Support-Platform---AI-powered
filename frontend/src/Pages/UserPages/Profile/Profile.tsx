import React from "react";

interface ProfileAvatarProps {
  src: string;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ src }) => {
  return (
    <img
      src={src}
      alt="profile"
      className="w-11 h-11 rounded-full object-cover cursor-pointer"
    />
  );
};

export default ProfileAvatar;
