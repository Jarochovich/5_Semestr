#include "pch.h"
#include <fstream>
#include <Windows.h>
#include <iostream>
#include <combaseapi.h>
#include "MathFactory.h"

using namespace std;


HMODULE hmodule;

// {417a53ef-d74b-4463-b9c0-7750b01855a1}
static const CLSID CLSID_CA =
{ 0x417a53ef, 0xd74b, 0x4463, { 0xb9, 0xc0, 0x77, 0x50, 0xb0, 0x18, 0x55, 0xa1 } };

const WCHAR* FNAME = L"OS12_COM.dll";
const WCHAR* VerInd = L"OS12_COM.1.0";
const WCHAR* ProgId = L"OS12_COM.1";

BOOL APIENTRY DllMain(
    HMODULE hModule,
    DWORD  ul_reason_for_call,
    LPVOID lpReserved
)
{
    cout << "DllMain\n";
    switch (ul_reason_for_call)
    {
    case DLL_PROCESS_ATTACH:
        hmodule = hModule;
        break;
    case DLL_THREAD_ATTACH:
    case DLL_THREAD_DETACH:
    case DLL_PROCESS_DETACH:
        break;
    }
    return TRUE;
}

HRESULT __declspec(dllexport) DllInstall(bool b, PCWSTR s)
{
    return S_OK;
}

HRESULT __declspec(dllexport) DllRegisterServer() {
    return RegisterServer(hmodule, CLSID_CA, FNAME, VerInd, ProgId);
}

HRESULT __declspec(dllexport) DllUnregisterServer() {
    return UnregisterServer(CLSID_CA, VerInd, ProgId);
}


STDAPI DllCanUnloadNow()
{
    return S_OK;
}

// Объект класс IClassFactory
STDAPI DllGetClassObject(const CLSID& clsid, const IID& iid, LPVOID* ppv) {
    HRESULT rc = E_UNEXPECTED;
    MathFactory* pF;
    if (clsid != CLSID_CA) rc = CLASS_E_CLASSNOTAVAILABLE;
    else if ((pF = new MathFactory()) == NULL) rc = E_OUTOFMEMORY;
    else {
        rc = pF->QueryInterface(iid, ppv);
        pF->Release();
    }
    return rc;
}