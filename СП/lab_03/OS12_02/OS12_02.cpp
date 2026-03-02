#include <iostream>
#include <Unknwn.h>
#include "../OS12_COM/IAdder.h"
#include "../OS12_COM/IMultiplier.h"

#define IERR(s) std::cout << "error: " << s << std::endl;
#define IRES(s,r) std::cout << s << r << std::endl;

IAdder* pIAdder = nullptr;
IMultiplier* pIMultiplier = nullptr;

// {417a53ef-d74b-4463-b9c0-7750b01855a1}
static const CLSID CLSID_CA =
{ 0x417a53ef, 0xd74b, 0x4463, { 0xb9, 0xc0, 0x77, 0x50, 0xb0, 0x18, 0x55, 0xa1 } };



void main() {
	IUnknown* pIUnknown = nullptr;

	CoInitialize(NULL);						// инициализация библиотеки OLE32

	HRESULT hr0 = CoCreateInstance(CLSID_CA, NULL, CLSCTX_INPROC_SERVER, IID_IUnknown, (void**)&pIUnknown);

	if (FAILED(hr0)) {
		IERR("CoCreateInstance");
		return;
	}

	if (SUCCEEDED(pIUnknown->QueryInterface(IID_IMULTIPLIER, (void**)&pIMultiplier))) {
		double z = 0.0;

		if (FAILED(pIMultiplier->Mul(2.0, 3.0, z))) {
			IERR("IMultiplier->Mul")
		}
		else {
			IRES("2 * 3 = ", z)
		}

		if (FAILED(pIMultiplier->Div(2.0, 3.0, z))) {
			IERR("IMultiplier->Div")
		}
		else {
			IRES("2 / 3 = ", z)
		}
	}
	else {
		IERR("IMultiplier->QueryInterface")
	}

	pIMultiplier->Release();

	if (SUCCEEDED(pIUnknown->QueryInterface(IID_IADDER, (void**)&pIAdder))) {
		double z = 0.0;

		if (FAILED(pIAdder->Add(2.0, 3.0, z))) {
			IERR("IAdder->Add")
		}
		else {
			IRES("2 + 3 = ", z)
		}

		if (FAILED(pIAdder->Sub(2.0, 3.0, z))) {
			IERR("IAdder->Sub")
		}
		else {
			IRES("2 - 3 = ", z)
		}
	}
	else {
		IERR("IAdder->QueryInterface")
	}

	pIAdder->Release();
	pIUnknown->Release();

	// CoFreeUnusedLibraries();		// чистка памяти; не обязательно вызывать (винда сама его вызывает)
	CoUninitialize();				// полное выключение COM
}
