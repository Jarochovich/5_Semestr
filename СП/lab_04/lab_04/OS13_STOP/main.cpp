#include <windows.h>

int main()
{
	HANDLE hStopEvent = CreateEvent(NULL,
		TRUE,
		FALSE,
		L"Stop");
	SetEvent(hStopEvent);
}