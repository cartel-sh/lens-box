"use client";

export const Address = ({ address }: { address: string }) => {
  const truncatedAddress = truncateEthAddress(address);

  return <span className="">{truncatedAddress}</span>;
};

const truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/;

export const truncateEthAddress = (address?: string, separator = "••••") => {
  if (!address) return "";
  const match = address.match(truncateRegex);
  if (!match) return address;
  return `${match[1]}${separator}${match[2]}`;
};
