#pragma once

// {D8909915-08D3-4D3C-80E6-A0E4EED5E6FD}
static const GUID CLSID_ComponentHT =
{ 0xd8909915, 0x8d3, 0x4d3c, {0x80, 0xe6, 0xa0, 0xe4, 0xee, 0xd5, 0xe6, 0xfd} };


HRESULT RegisterServer(HMODULE hModule,            // DLL module handle
	const CLSID& clsid,         // Class ID
	const WCHAR* szFriendlyName, // Friendly Name
	const WCHAR* szVerIndProgID, // Programmatic
	const WCHAR* szProgID);       //   IDs

HRESULT UnregisterServer(const CLSID& clsid,
	const WCHAR* szVerIndProgID,
	const WCHAR* szProgID);